import App from '@dfgpublicidade/node-app-module';
import chai, { expect } from 'chai';
import express, { Express, NextFunction, Request, Response } from 'express';
import http from 'http';
import { after, before, describe, it } from 'mocha';
import { Db, MongoClient } from 'mongodb';
import Log from '../src';
import ChaiHttp = require('chai-http');

/* Tests */
chai.use(ChaiHttp);

describe('index.ts', (): void => {
    let app: App;
    let exp: Express;
    let httpServer: http.Server;
    let client: MongoClient;
    let db: Db;

    // eslint-disable-next-line no-console
    const err: (msg: string) => void = console.error;
    let logMsg: string = '';

    const collectionName: string = 'log_test_col';

    before(async (): Promise<void> => {
        // eslint-disable-next-line no-console
        console.error = (msg: string): void => {
            logMsg = msg;
        };

        exp = express();
        const port: number = 3000;

        exp.set('port', port);

        httpServer = http.createServer(express);

        if (!process.env.MONGO_TEST_URL) {
            throw new Error('MONGO_TEST_URL must be set');
        }

        client = await MongoClient.connect(process.env.MONGO_TEST_URL, {
            poolSize: 1,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        db = client.db();

        app = new App({
            appInfo: {
                name: 'test',
                version: 'v1'
            },
            config: {
                log: {
                    user: {
                        nameField: 'id'
                    },
                    system: {
                        nameField: 'identificacao'
                    }
                }
            },
            connectionName: '',
            db
        });

        exp.use((req: Request, res: Response, next: NextFunction): void => {
            if (!req.headers.anonimous) {
                req.system = {
                    identificacao: 'sistema-teste'
                };
                req.user = {
                    id: req.headers.id
                };
            }

            next();
        });

        exp.get('/', async (req: Request, res: Response): Promise<void> => {
            Log.emit(app, req, collectionName, {
                'teste': 1,
                'teste.teste': 1,
                'teste2': {}
            });

            res.end();
        });

        return new Promise<void>((
            resolve: () => void
        ): void => {
            httpServer.listen(port, (): void => {
                resolve();
            });
        });
    });

    after(async (): Promise<void> => {
        // eslint-disable-next-line no-console
        console.error = err;

        try {
            await db.collection(collectionName).drop();

            client.close();
        }
        catch (error) {
            //
        }

        return new Promise<void>((
            resolve: () => void
        ): void => {
            httpServer.close((): void => {
                resolve();
            });
        });
    });

    it('emit', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);

        const log: any = await db.collection(collectionName).findOne({});

        expect(log).exist.and.have.property('content')
            .which.have.property('teste').eq(1);

        await db.collection(collectionName).drop();
    });

    it('emit', async (): Promise<void> => {
        const res: ChaiHttp.Response = await chai.request(exp).keepOpen().get('/').set('anonimous', 'true');

        // eslint-disable-next-line no-magic-numbers
        expect(res).to.have.status(200);

        const log: any = await db.collection(collectionName).findOne({});

        expect(log).exist.and.have.property('content')
            .which.have.property('teste').eq(1);

        await db.collection(collectionName).drop();
    });

    it('emit', async (): Promise<void> => {
        Log.emit(app, undefined, collectionName, {
            teste: 1
        });

        const log: any = await db.collection(collectionName).findOne({});

        expect(log).exist.and.have.property('content')
            .which.have.property('teste').eq(1);

        await db.collection(collectionName).drop();
    });

    it('emit', async (): Promise<void> => {
        Log.emit(app, undefined, collectionName);

        const log: any = await db.collection(collectionName).findOne({});

        expect(log).exist;

        await db.collection(collectionName).drop();
    });

    it('emit', async (): Promise<void> => {
        const client: MongoClient = await MongoClient.connect(process.env.MONGO_TEST_URL, {
            poolSize: 1,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const db: Db = client.db();

        client.close();

        await Log.emit({
            ...app,
            db
        } as App, undefined, collectionName);

        expect(logMsg).to.have.property('message').which.contain('server is closed');
    });
});
