import gleam/bool
import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/option
import gleam/string
import lustre_http
import utils

pub type AccountType {
  User
  Org
}

pub type Theme {
  Light
  Dark
}

pub type InitialConfig {
  InitialConfig(
    owner: option.Option(String),
    owner_type: AccountType,
    theme: Theme,
  )
}

fn theme_decoder() -> decode.Decoder(Theme) {
  use variant <- decode.then(decode.string)
  case variant {
    "light" -> decode.success(Light)
    "dark" -> decode.success(Dark)
    _ -> decode.failure(Dark, "Theme")
  }
}

fn owner_type_decoder() -> decode.Decoder(AccountType) {
  use variant <- decode.then(decode.string)
  case variant {
    "user" -> decode.success(User)
    "org" -> decode.success(Org)
    _ -> decode.failure(User, "AccountType")
  }
}

pub fn initial_config_decoder() -> decode.Decoder(InitialConfig) {
  use owner <- decode.field("owner", decode.optional(decode.string))
  use owner_type <- decode.field("owner_type", owner_type_decoder())
  use theme <- decode.field("theme", theme_decoder())
  decode.success(InitialConfig(owner:, owner_type:, theme:))
}

pub type Repo {
  Repo(
    id: Int,
    name: String,
    url: String,
    description: option.Option(String),
    language: option.Option(String),
  )
}

pub fn repo_decoder() -> decode.Decoder(Repo) {
  use id <- decode.field("id", decode.int)
  use name <- decode.field("name", decode.string)
  use url <- decode.field("url", decode.string)
  use description <- decode.field("description", decode.optional(decode.string))
  use language <- decode.field("language", decode.optional(decode.string))
  decode.success(Repo(id:, name:, url:, description:, language:))
}

pub type ReposResponse =
  List(Repo)

pub fn repos_response_decoder() -> decode.Decoder(ReposResponse) {
  repo_decoder() |> decode.list
}

pub type Commit {
  Commit(sha: String)
}

fn commit_decoder() -> decode.Decoder(Commit) {
  use sha <- decode.field("sha", decode.string)
  decode.success(Commit(sha:))
}

pub type Tag {
  Tag(name: String, commit: Commit)
}

fn tag_decoder() -> decode.Decoder(Tag) {
  use name <- decode.field("name", decode.string)
  use commit <- decode.field("commit", commit_decoder())
  decode.success(Tag(name:, commit:))
}

pub type TagsResponse =
  List(Tag)

pub fn tags_response_decoder() -> decode.Decoder(TagsResponse) {
  tag_decoder() |> decode.list
}

pub type ChangelogCommitAuthor {
  ChangelogCommitAuthor(name: String, email: String)
}

fn changelog_commit_author_decoder() -> decode.Decoder(ChangelogCommitAuthor) {
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", decode.string)
  decode.success(ChangelogCommitAuthor(name:, email:))
}

pub type ChangelogCommitDetails {
  ChangelogCommitDetails(author: ChangelogCommitAuthor, message: String)
}

fn changelog_commit_details_decoder() -> decode.Decoder(ChangelogCommitDetails) {
  use author <- decode.field("author", changelog_commit_author_decoder())
  use message <- decode.field("message", decode.string)
  decode.success(ChangelogCommitDetails(author:, message:))
}

pub type ChangelogCommit {
  ChangelogCommit(sha: String, details: ChangelogCommitDetails)
}

fn changelog_commit_decoder() -> decode.Decoder(ChangelogCommit) {
  use sha <- decode.field("sha", decode.string)
  use details <- decode.field("commit", changelog_commit_details_decoder())
  decode.success(ChangelogCommit(sha:, details:))
}

pub type ChangesResponse {
  ChangelogResponse(commits: List(ChangelogCommit))
}

pub fn changelog_response_decoder() -> decode.Decoder(ChangesResponse) {
  use commits <- decode.field(
    "commits",
    decode.list(changelog_commit_decoder()),
  )
  decode.success(ChangelogResponse(commits:))
}

pub fn theme_to_string(theme: Theme) -> String {
  case theme {
    Dark -> "🌙"
    Light -> "☀️"
  }
}

pub fn get_next_theme(current: Theme) -> Theme {
  case current {
    Dark -> Light
    Light -> Dark
  }
}

pub type Config {
  Config(theme: Theme)
}

pub fn owner_types() -> List(AccountType) {
  [User, Org]
}

pub fn owner_type_to_string(owner_type: AccountType) -> String {
  case owner_type {
    Org -> "org"
    User -> "user"
  }
}

pub type State {
  Initial
  ConfigError(error: lustre_http.HttpError)
  ConfigLoaded(
    user_name: option.Option(String),
    owner_type: AccountType,
    fetching_repos: Bool,
  )
  WithReposError(
    user_name: String,
    owner_type: AccountType,
    error: lustre_http.HttpError,
  )
  WithRepos(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    fetching_tags: Bool,
    selected_repo: option.Option(String),
  )
  WithTagsError(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    error: lustre_http.HttpError,
  )
  WithTags(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: option.Option(String),
    end_tag: option.Option(String),
    fetching_changes: Bool,
  )
  WithChangesError(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: String,
    end_tag: String,
    error: lustre_http.HttpError,
  )
  WithChanges(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: String,
    end_tag: String,
    changes: ChangesResponse,
  )
}

pub type Model {
  Model(config: Config, state: State, debug: Bool)
}

pub fn init_model() -> Model {
  Model(config: Config(theme: Dark), state: Initial, debug: False)
}

pub type Msg {
  InitialConfigFetched(Result(InitialConfig, lustre_http.HttpError))
  UserChangedTheme
  AccountTypeChanged(AccountType)
  UserEnteredUsernameInput(String)
  UserRequestedRepos
  ReposFetched(Result(ReposResponse, lustre_http.HttpError))
  UserEnteredRepoFilterQuery(String)
  RepoChosen(String)
  TagsFetched(#(String, Result(TagsResponse, lustre_http.HttpError)))
  StartTagChosen(String)
  EndTagChosen(String)
  UserRequestedChangelog
  ChangesFetched(
    #(String, String, Result(ChangesResponse, lustre_http.HttpError)),
  )
}

pub fn display_config(config: Config) -> String {
  "- theme: " <> config.theme |> theme_to_string
}

pub fn display_model(model: Model) -> String {
  let state_info = case model.state {
    Initial -> ["- state: Initial"]
    ConfigError(error) -> ["- error: " <> error |> utils.http_error_to_string]
    ConfigLoaded(user_name, owner_type, fetching_repos) -> [
      "- state: ConfigLoaded",
      "- user_name: " <> user_name |> string.inspect,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- fetching repos: " <> fetching_repos |> bool.to_string,
    ]
    WithReposError(user_name, owner_type, error) -> [
      "- state: WithReposError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithRepos(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      fetching_tags,
      selected_repo,
    ) -> [
      "- state: WithRepos",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- fetching_tags: " <> fetching_tags |> bool.to_string,
      "- selected_repo: " <> selected_repo |> string.inspect,
    ]
    WithTagsError(user_name, owner_type, repos, repo_filter_query, repo, error) -> [
      "- state: WithTagsError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithTags(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      repo,
      tags,
      start_tag,
      end_tag,
      fetching_changes,
    ) -> [
      "- state: WithTags",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag |> string.inspect,
      "- end_tag: " <> end_tag |> string.inspect,
      "- fetching_changes: " <> fetching_changes |> bool.to_string,
    ]
    WithChangesError(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      repo,
      tags,
      start_tag,
      end_tag,
      error,
    ) -> [
      "- state: WithChangesError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag,
      "- end_tag: " <> end_tag,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithChanges(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      selected_repo,
      tags,
      start_tag,
      end_tag,
      changes,
    ) -> [
      "- state: WithChanges",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> selected_repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag,
      "- end_tag: " <> end_tag,
      "- changes: " <> changes.commits |> list.length |> int.to_string,
    ]
  }

  [model.config |> display_config]
  |> list.append(state_info)
  |> string.join("\n")
}
