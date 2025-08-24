/**
 * /!\ This file is auto-generated.
 *
 * This is the entry point of your standalone application.
 *
 * There are multiple tags used by the editor to inject code automatically:
 *     - `wle:auto-imports:start` and `wle:auto-imports:end`: The list of import statements
 *     - `wle:auto-register:start` and `wle:auto-register:end`: The list of component to register
 */

/* wle:auto-imports:start */
import {FixedFoveation} from '@wonderlandengine/components';
import {MouseLookComponent} from '@wonderlandengine/components';
import {TargetFramerate} from '@wonderlandengine/components';
import {WasdControlsComponent} from '@wonderlandengine/components';
import {StatsHtmlComponent} from 'wle-stats';
import {Grass} from './grass.js';
import {Move} from './move.js';
/* wle:auto-imports:end */

export default function(engine) {
/* wle:auto-register:start */
engine.registerComponent(FixedFoveation);
engine.registerComponent(MouseLookComponent);
engine.registerComponent(TargetFramerate);
engine.registerComponent(WasdControlsComponent);
engine.registerComponent(StatsHtmlComponent);
engine.registerComponent(Grass);
engine.registerComponent(Move);
/* wle:auto-register:end */
}
