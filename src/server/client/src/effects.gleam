import constants
import gleam/string
import lustre/effect
import lustre_http
import plinth/browser/document
import plinth/browser/element
import plinth/browser/window
import plinth/javascript/global
import types

const dev = False

fn base_url() -> String {
  case constants.public {
    False ->
      case dev {
        False -> window.location() <> "api"
        True -> "http://127.0.0.1:9899/api"
      }
    True -> "https://api.github.com"
  }
}

pub fn fetch_initial_config() -> effect.Effect(types.Msg) {
  let expect =
    lustre_http.expect_json(
      types.initial_config_decoder(),
      types.InitialConfigFetched,
    )

  lustre_http.get(base_url() <> "/config", expect)
}

pub fn fetch_repos_for_public_version() -> effect.Effect(types.Msg) {
  fetch_repos("dhth", types.User)
}

pub fn fetch_repos(
  user_name: String,
  owner_type: types.AccountType,
) -> effect.Effect(types.Msg) {
  let expect =
    lustre_http.expect_json(types.repos_response_decoder(), types.ReposFetched)

  lustre_http.get(user_name |> repos_endpoint(owner_type), expect)
}

fn repos_endpoint(user_name: String, owner_type: types.AccountType) -> String {
  [
    base_url(),
    case owner_type {
      types.Org -> "orgs"
      types.User -> "users"
    },
    user_name,
    "repos?sort=updated&direction=desc&per_page=100&type=sources",
  ]
  |> string.join("/")
}

pub fn fetch_tags(username: String, repo: String) -> effect.Effect(types.Msg) {
  let expect =
    lustre_http.expect_json(types.tags_response_decoder(), fn(result) {
      types.TagsFetched(#(repo, result))
    })

  lustre_http.get(tags_endpoint(username, repo), expect)
}

pub fn fetch_changes(
  user_name: String,
  repo: String,
  start_tag: String,
  end_tag: String,
) -> effect.Effect(types.Msg) {
  let expect =
    lustre_http.expect_json(types.changes_decoder(), fn(result) {
      types.ChangesFetched(#(start_tag, end_tag, result))
    })

  lustre_http.get(
    changelog_endpoint(user_name, repo, start_tag, end_tag),
    expect,
  )
}

fn tags_endpoint(user_name: String, repo: String) -> String {
  [base_url(), "repos", user_name, repo, "tags"]
  |> string.join("/")
}

fn changelog_endpoint(
  user_name: String,
  repo: String,
  start_tag: String,
  end_tag: String,
) -> String {
  [
    base_url(),
    "repos",
    user_name,
    repo,
    "compare",
    start_tag <> "..." <> end_tag,
  ]
  |> string.join("/")
}

pub fn scroll_element_into_view(id: String) -> effect.Effect(types.Msg) {
  let scroll_fn = fn() {
    case id |> document.get_element_by_id {
      Error(_) -> Nil
      Ok(e) -> {
        e |> element.scroll_into_view
      }
    }
  }

  fn(_) {
    // the timeout is needed to let the lustre runtime render the latest view
    // maybe there's a nicer way to do this
    global.set_timeout(100, scroll_fn)
    Nil
  }
  |> effect.from
}
