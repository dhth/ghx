use std::env::VarError;
use std::process::Command;

#[derive(thiserror::Error, Debug)]
pub enum AuthTokenError {
    #[error("GH_TOKEN is not valid unicode: {0}")]
    EnvVarNotValid(VarError),
    #[error("couldn't find gh executable")]
    CouldntFindGhExecutable,
    #[error("couldn't execute \"gh auth token\"")]
    CouldntExecuteGhCommand(std::io::Error),
    #[error("gh command failed; stderr: {0}")]
    GhCommandFailed(String),
    #[error("gh command output is not valid utf-8")]
    GhOutputNotValidUtf8,
}

pub fn get_auth_token() -> Result<String, AuthTokenError> {
    let maybe_token_from_env = match std::env::var("GH_TOKEN") {
        Ok(v) => Ok(Some(v)),
        Err(std::env::VarError::NotPresent) => Ok(None),
        Err(e) => Err(AuthTokenError::EnvVarNotValid(e)),
    }?;

    if let Some(token_from_env) = maybe_token_from_env {
        return Ok(token_from_env);
    }

    let gh_exe_path = which::which("gh").map_err(|_| AuthTokenError::CouldntFindGhExecutable)?;

    let gh_auth_token_output = Command::new(&gh_exe_path)
        .args(["auth", "token"])
        .output()
        .map_err(AuthTokenError::CouldntExecuteGhCommand)?;

    if !gh_auth_token_output.status.success() {
        let stderr = String::from_utf8(gh_auth_token_output.stderr)
            .unwrap_or("<invalid stderr>".into())
            .trim()
            .to_string();
        return Err(AuthTokenError::GhCommandFailed(stderr));
    }

    let token_from_gh = String::from_utf8(gh_auth_token_output.stdout)
        .map_err(|_| AuthTokenError::GhOutputNotValidUtf8)?
        .trim()
        .to_string();

    Ok(token_from_gh)
}
