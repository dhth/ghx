use crate::auth::AuthTokenError;

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error(transparent)]
    CouldntGetGhToken(AuthTokenError),
    #[error(transparent)]
    CouldntRunServer(anyhow::Error),
}

impl AppError {
    pub fn code(&self) -> Option<u16> {
        match self {
            AppError::CouldntGetGhToken(e) => match e {
                AuthTokenError::EnvVarNotValid(_) => None,
                AuthTokenError::CouldntFindGhExecutable => None,
                AuthTokenError::CouldntExecuteGhCommand(_) => None,
                AuthTokenError::GhCommandFailed(_) => None,
                AuthTokenError::GhOutputNotValidUtf8 => Some(100),
            },
            AppError::CouldntRunServer(_) => None,
        }
    }

    pub fn follow_up(&self) -> Option<String> {
        match self {
            AppError::CouldntGetGhToken(e) => match e {
                AuthTokenError::EnvVarNotValid(_) => {
                    Some("Make sure the value of GH_TOKEN is valid".into())
                }
                AuthTokenError::CouldntFindGhExecutable => Some(
                    r#"
ghx depends on gh (https://github.com/cli/cli) to obtain an auth token for you.
If you don't want to dely on gh, set the environment variable GH_TOKEN with a valid auth token."#
                        .trim()
                        .into(),
                ),
                AuthTokenError::CouldntExecuteGhCommand(_) => Some(r#"Suggestion: Try running "gh auth token" yourself to see what's going wrong with it."#.into()),
                AuthTokenError::GhCommandFailed(_) => None,
                AuthTokenError::GhOutputNotValidUtf8 => None,
            },
            AppError::CouldntRunServer(_) => None,
        }
    }
}
