mod handlers;
mod state;
mod utils;

use axum::{Router, http::Method, routing::get};
use handlers::{
    AssetType, get_changes_handler, get_config_handler, get_org_repos_handler, get_static_asset,
    get_tags_handler, get_user_repos_handler,
};
use reqwest::Client;
use state::AppState;
pub use state::Config;
pub use state::Theme;
use tokio::signal;
use tower_http::cors::{Any, CorsLayer};
use utils::find_open_port_in_range;

const PORT_RANGE_START: u16 = 9899;
const PORT_RANGE_END: u16 = 10199;

pub async fn run_server(
    start_config: Config,
    token: String,
    port: Option<u16>,
    skip_opening: bool,
) -> anyhow::Result<()> {
    let client = Client::new();
    let app_state = AppState {
        client,
        token: format!("token {}", token),
        config: start_config,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET])
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(move || get_static_asset(AssetType::Html)))
        .route(
            "/priv/static/ghch.mjs",
            get(move || get_static_asset(AssetType::Js)),
        )
        .route(
            "/priv/static/ghch.css",
            get(move || get_static_asset(AssetType::Css)),
        )
        .route(
            "/priv/static/custom.css",
            get(move || get_static_asset(AssetType::CustomCss)),
        )
        .route(
            "/priv/static/changes.mjs",
            get(move || get_static_asset(AssetType::Js)),
        )
        .route(
            "/priv/static/favicon.png",
            get(move || get_static_asset(AssetType::Favicon)),
        )
        .route("/api/config", get(get_config_handler))
        .route("/api/users/{user_name}/repos", get(get_user_repos_handler))
        .route("/api/orgs/{user_name}/repos", get(get_org_repos_handler))
        .route("/api/repos/{user_name}/{repo}/tags", get(get_tags_handler))
        .route(
            "/api/repos/{user_name}/{repo}/compare/{range}",
            get(get_changes_handler),
        )
        .with_state(app_state)
        .layer(cors);

    let port = port.map(Ok).unwrap_or_else(|| {
        find_open_port_in_range(PORT_RANGE_START, PORT_RANGE_END)
            .ok_or(anyhow::anyhow!("couldn't find open port"))
    })?;

    let address = format!("127.0.0.1:{}", port);

    let listener = tokio::net::TcpListener::bind(&address).await.unwrap();

    let http_address = format!("http://{}", &address);
    if !skip_opening {
        if open::that(&http_address).is_err() {
            eprintln!(
                "couldn't open your browser, please open the following address manually:\n{}",
                &http_address
            )
        } else {
            println!("serving results on {}", &http_address);
        }
    } else {
        println!("serving results on {}", &http_address);
    }

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

#[allow(clippy::expect_used)]
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install ctrl+c handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    println!("\nbye 👋");
}
