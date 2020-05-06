import { Engine } from '@frogfish/kona';
let engine: Engine;

module.exports.engine = async (): Promise<Engine> => {
  return new Promise((resolve, reject) => {
    let engine = global['engine'];

    if (engine) {
      return resolve(engine);
    } else {
      engine = new Engine(`${process.env.ENGINE_SYSTEM_ROOT}/test/service.yaml`, {
        root: process.env.KONA_ROOT,
      });

      engine.init().then(() => {
        global['engine'] = engine;
        return resolve(engine);
      });
    }
  });
};
