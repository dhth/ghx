import ghx/constants
import ghx/effects
import ghx/types.{type Model, type Msg, init_model}
import ghx/update
import ghx/view
import lustre
import lustre/effect

pub fn main() {
  let app = lustre.application(init, update.update, view.view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
}

fn init(_) -> #(Model, effect.Effect(Msg)) {
  let init_effect = case constants.public {
    False -> effects.fetch_initial_config()
    True -> effect.none()
  }
  #(init_model(), init_effect)
}
