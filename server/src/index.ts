import chalk from 'chalk';
import * as Hapi from 'hapi';
import * as inert from 'inert';
import * as _ from 'lodash';
import { MongoClient } from 'mongodb';
import * as path from 'path';
import { MediaDao } from './db/media.dao';
import { api, singlePageApp } from './routes';
import { GridFsStorage } from './storage/gridfs-storage';

// tslint:disable:no-console

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

async function mongoConnect(): Promise<MongoClient> {
    return MongoClient.connect('mongodb://localhost:27017', {
        useNewUrlParser: true,
        reconnectTries: 0
    });
}

(async () => {
    const server = new Hapi.Server({
        port: 3000,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: path.resolve(__dirname, 'public')
            },
            // Pretty print
            json: {
                space: 4
            }
        }
    });
    
    const client = await mongoConnect();

    try {
        const db = client.db('bitmap-flow');
        const media = new MediaDao(db.collection('media'));

        const storage = new GridFsStorage(db);

        // Remove documents in Mongo that don't have a file associated with it
        const missingIds = await media.identifyMissing(storage);
        if (missingIds.length > 0) {
            console.log(`Couldn't find ${missingIds.length} files, removing from DB`);
            console.log(`Deleted ${await media.cleanMissing(missingIds)} documents`);
        }

        // Remove files that don't have a Media object in Mongo associated with it
        const extras = await media.identifyExtra(storage);
        if (extras.length > 0) {
            console.log(`Found ${extras.length} files in storage not in DB, removing`);
            await Promise.all(extras.map((uploadId) => storage.delete(uploadId)));
        }

        server.events.on({ name: 'request', channels: 'error' }, (_r, event) => {
            console.log(event.error);
        });

        await server.register(inert);

        server.route(api(media, storage));
        server.route(singlePageApp(server));

        logRoutes(server);
        await server.start();
        console.log(`Magic is happening at ${server.info.uri}`);
    } catch (err) {
        console.error(err);
        return Promise.all([server.stop(), client.close()]);
    }
})();

function getRoutes(server: Hapi.Server): Array<{ verb: string, path: string }> {
    const routes: any = [];
    const byVerb = (server as any)._core.router.routes;

    for (const httpVerb of Object.keys(byVerb)) {
        for (const route of byVerb[httpVerb].routes) {
            routes.push({
                verb: route.route.method.toUpperCase(),
                path: route.path
            });
        }
    }

    return routes;
}

function logRoutes(server: Hapi.Server) {
    const routes = _.orderBy(getRoutes(server), ['path', 'verb'], ['asc', 'asc']);

    console.log('Available routes:\n');
    const maxVerbLength = _(routes).map((r) => r.verb.length).max()!;
    for (const route of routes) {
        const verb = route.verb + ' '.repeat(maxVerbLength - route.verb.length);
        console.log(chalk.bold(`  ${verb} `) + route.path);
    }
    console.log();
}
