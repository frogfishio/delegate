import { Engine } from '@frogfish/kona';

let logger;
const error = require('@frogfish/kona/error');

export default class DelegateActivationHandler {
  private _api;

  constructor(private _engine: Engine, private _user) {
    logger = _engine.log.log('service:delegate:activation');
    this._api = _engine.delegate;
  }

  async get(req, res, next) {
    console.log(`!split --------> ${JSON.stringify(req.path.split('/'))} -> ${JSON.stringify(this._user)}`);
    try {
      return res.json(await this._api.activate(this._user.id, req.path.split('/')[4]));
    } catch (err) {
      error.send(err, res);
    }
  }
}
