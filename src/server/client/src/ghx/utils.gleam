import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/json
import gleam/list
import gleam/string
import gleam/time/duration.{type Duration}
import lustre_http

pub fn http_error_to_string(error: lustre_http.HttpError) -> String {
  case error {
    lustre_http.BadUrl(u) -> "bad url: " <> u
    lustre_http.InternalServerError(e) -> "internal server error: " <> e
    lustre_http.JsonError(e) ->
      case e {
        json.UnableToDecode(de) ->
          de
          |> list.map(fn(err) {
            case err {
              decode.DecodeError(exp, found, _) ->
                "couldn't decode JSON; expected: "
                <> exp
                <> ", found: "
                <> found
            }
          })
          |> string.join(", ")
        json.UnexpectedByte(_) -> "unexpected byte"
        json.UnexpectedEndOfInput -> "unexpected end of input"
        json.UnexpectedFormat(_) -> "unexpected format"
        json.UnexpectedSequence(_) -> "unexpected sequence"
      }
    lustre_http.NetworkError -> "network error"
    lustre_http.NotFound -> "not found"
    lustre_http.OtherError(code, body) ->
      "non success HTTP response; status: "
      <> int.to_string(code)
      <> ", body: \n"
      <> body
    lustre_http.Unauthorized -> "unauthorized"
  }
}

pub fn simple_hash(input: String) -> Int {
  string.to_utf_codepoints(input)
  |> list.map(string.utf_codepoint_to_int)
  |> list.fold(0, fn(a, b) { a * 31 + b })
}

pub fn humanize_duration(dur: Duration) -> String {
  let duration_secs = dur |> duration.to_seconds |> float.round
  case duration_secs < 60 {
    True -> { duration_secs |> int.to_string } <> " seconds"
    False -> {
      let duration_mins = duration_secs / 60
      case duration_mins < 60 {
        True -> { duration_mins |> int.to_string } <> " mins"
        False -> {
          let duration_hours = duration_mins / 60
          case duration_hours < 24 {
            True -> { duration_hours |> int.to_string } <> " hours"
            False -> {
              let duration_days = duration_hours / 24
              { duration_days |> int.to_string } <> " days"
            }
          }
        }
      }
    }
  }
}
