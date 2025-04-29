import constants
import effects
import lustre
import lustre/effect
import types.{type Model, type Msg, init_model}
import update
import view

pub fn main() {
  let app = lustre.application(init, update.update, view.view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

fn init(_) -> #(Model, effect.Effect(Msg)) {
  let init_effect = case constants.public {
    False -> effects.fetch_initial_config()
    True -> effects.fetch_repos_for_public_version()
  }
  #(init_model(), init_effect)
}
