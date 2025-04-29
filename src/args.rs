use crate::server::Theme;
use crate::types::OwnerType;
use clap::Parser;
use clap::Subcommand;

#[derive(Parser)]
/// ghch simplifies viewing changes for GitHub repositories
pub struct Args {
    #[command(subcommand)]
    pub command: GhChCommand,
}

#[derive(Subcommand, Debug)]
pub enum GhChCommand {
    /// Serve ghch's web interface
    #[command()]
    Serve {
        /// Owner to show results for
        #[arg(short = 'o', long = "owner", value_name = "STRING")]
        owner: Option<String>,
        /// Owner type
        #[arg(
            short = 't',
            long = "owner-type",
            value_name = "STRING",
            default_value = "user"
        )]
        owner_type: OwnerType,
        /// Theme to use
        #[arg(
            short = 'T',
            long = "theme",
            value_name = "STRING",
            default_value = "dark"
        )]
        theme: Theme,
        /// Whether to skip opening the front-end in the browser
        #[arg(short = 's', long = "skip-opening")]
        skip_opening: bool,
    },
}
