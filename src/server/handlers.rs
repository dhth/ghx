use super::{AppState, Config};
use axum::body::Body;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response as AxumResponse};
use reqwest::Client;
use reqwest::Error as ReqwestError;
use reqwest::Response as ReqwestResponse;

const HTML: &[u8] = include_bytes!("client/index.html");
const JS: &[u8] = include_bytes!("client/priv/static/ghx.mjs");
const CSS: &[u8] = include_bytes!("client/priv/static/ghx.css");
const CUSTOM_CSS: &[u8] = include_bytes!("client/priv/static/custom.css");
const FAVICON: &[u8] = include_bytes!("client/priv/static/favicon.png");

#[derive(Debug, thiserror::Error)]
pub enum GetReposError {
    #[error("remote server didn't respond successfully: {0:?}")]
    CouldntCreateBody(String),
}

impl IntoResponse for GetReposError {
    fn into_response(self) -> AxumResponse {
        match self {
            GetReposError::CouldntCreateBody(e) => (StatusCode::BAD_GATEWAY, e).into_response(),
        }
    }
}

pub async fn get_config_handler(State(state): State<AppState>) -> Config {
    state.config
}

pub async fn get_user_repos_handler(
    Path(user_name): Path<String>,
    State(state): State<AppState>,
) -> Result<AxumResponse, GetReposError> {
    let response = state
        .client
        .get(format!("https://api.github.com/users/{}/repos", user_name))
        .query(&[("sort", "updated")])
        .query(&[("direction", "desc")])
        .query(&[("type", "sources")])
        .query(&[("per_page", "100")])
        .header("authorization", state.token.as_str())
        .header("user-agent", "test-app")
        .send()
        .await;

    get_response(response).await
}

pub async fn get_org_repos_handler(
    Path(user_name): Path<String>,
    State(state): State<AppState>,
) -> Result<AxumResponse, GetReposError> {
    let client = Client::new();

    let response = client
        .get(format!("https://api.github.com/orgs/{}/repos", user_name))
        .query(&[("sort", "updated")])
        .query(&[("direction", "desc")])
        .query(&[("type", "sources")])
        .query(&[("per_page", "100")])
        .header("authorization", state.token.as_str())
        .header("user-agent", "test-app")
        .send()
        .await;

    get_response(response).await
}

pub async fn get_tags_handler(
    Path((user_name, repo)): Path<(String, String)>,
    State(state): State<AppState>,
) -> Result<AxumResponse, GetReposError> {
    let client = Client::new();

    let response = client
        .get(format!(
            "https://api.github.com/repos/{}/{}/tags",
            user_name, repo,
        ))
        .header("authorization", state.token.as_str())
        .header("user-agent", "test-app")
        .send()
        .await;

    get_response(response).await
}

pub async fn get_changes_handler(
    Path((user_name, repo, range)): Path<(String, String, String)>,
    State(state): State<AppState>,
) -> Result<AxumResponse, GetReposError> {
    let client = Client::new();

    let response = client
        .get(format!(
            "https://api.github.com/repos/{}/{}/compare/{}",
            user_name, repo, range
        ))
        .header("authorization", state.token.as_str())
        .header("user-agent", "test-app")
        .send()
        .await;

    get_response(response).await
}

async fn get_response(
    response: Result<ReqwestResponse, ReqwestError>,
) -> Result<AxumResponse, GetReposError> {
    let resp = match response {
        Ok(resp) => {
            let status = resp.status();
            let headers = resp.headers().clone();
            let body = resp.bytes().await.unwrap();

            let mut response_builder = AxumResponse::builder().status(status);
            for (key, value) in headers {
                if let Some(key) = key {
                    response_builder = response_builder.header(key, value);
                }
            }

            response_builder
                .body(Body::from(body))
                .map_err(|e| GetReposError::CouldntCreateBody(format!("{:?}", e)))?
        }
        Err(err) => AxumResponse::builder()
            .status(StatusCode::BAD_GATEWAY)
            .body(Body::from(format!(
                "couldn't forward request to GitHub: {:?}",
                err
            )))
            .map_err(|e| {
                GetReposError::CouldntCreateBody(format!("{:?} underlying: {:?}", e, err))
            })?,
    };

    Ok(resp)
}

pub enum AssetType {
    Html,
    Css,
    CustomCss,
    Js,
    Favicon,
}

pub async fn get_static_asset(asset_type: AssetType) -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    let (content_type, value) = match asset_type {
        AssetType::Html => ("text/html", HTML),
        AssetType::Css => ("text/css", CSS),
        AssetType::CustomCss => ("text/css", CUSTOM_CSS),
        AssetType::Js => ("text/javascript", JS),
        AssetType::Favicon => ("image/png", FAVICON),
    };

    #[allow(clippy::unwrap_used)]
    headers.insert("Content-Type", content_type.parse().unwrap());
    (headers, value)
}
