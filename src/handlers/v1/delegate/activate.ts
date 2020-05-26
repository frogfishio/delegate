import { Engine } from '@frogfish/kona';

let logger;
const error = require('@frogfish/kona/error');

export default class DelegateActivationHandler {
  private _api;
  private _util;

  constructor(private _engine: Engine, private _user) {
    logger = _engine.log.log('service:delegate:activation');
    this._api = _engine.delegate;
    this._util = require('@frogfish/kona/util');
  }

  async get(req, res, next) {
    try {
      return res.json(await this._api.activate(this._user.id, req.path.split('/')[4]));
    } catch (err) {
      this._util.error(err, res, logger, 'svc_delegate_act');
    }
  }
}
