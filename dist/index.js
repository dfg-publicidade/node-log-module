"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ipware_1 = __importDefault(require("ipware"));
const url_1 = __importDefault(require("url"));
/* Module */
class Log {
    static emit(app, req, collectionName, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = app.db.collection(collectionName);
            const getIp = ipware_1.default().get_ip;
            const log = {};
            log.app = app.info;
            if (req) {
                log.request = req.id;
                log.action = url_1.default.parse(req.url).pathname;
                log.method = req.method;
                log.ip = getIp(req).clientIp;
                if (req.usuario) {
                    log.user = {
                        id: req.usuario.id,
                        nome: req.usuario.nome
                    };
                }
                if (req.sistema) {
                    log.system = {
                        id: req.sistema.id,
                        nome: req.sistema.nome
                    };
                }
            }
            if (obj) {
                log.content = this.removeInvalidKeys(obj);
            }
            log.time = new Date();
            try {
                yield collection.insertOne(log);
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
            return Promise.resolve();
        });
    }
    static removeInvalidKeys(obj) {
        obj = Object.assign({}, obj);
        let key;
        for (key of Object.keys(obj)) {
            if (obj[key] instanceof Object) {
                obj[key] = this.removeInvalidKeys(obj[key]);
            }
            if (key.indexOf('.') > -1) {
                obj[key.replace(/\./g, '_')] = obj[key];
                delete obj[key];
            }
        }
        return obj;
    }
}
exports.default = Log;
