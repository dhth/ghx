use crate::args::Args;
use crate::args::GhChCommand;
use crate::auth::get_auth_token;
use crate::errors::AppError;
use crate::server::{Config, run_server};

pub async fn handle(args: Args) -> Result<(), AppError> {
    match args.command {
        GhChCommand::Serve {
            owner,
            owner_type,
            theme,
            skip_opening,
        } => {
            let start_config = Config {
                owner,
                owner_type,
                theme,
            };
            let gh_token = get_auth_token().map_err(AppError::CouldntGetGhToken)?;

            run_server(start_config, gh_token, skip_opening)
                .await
                .map_err(AppError::CouldntRunServer)?;
        }
    }

    Ok(())
}
