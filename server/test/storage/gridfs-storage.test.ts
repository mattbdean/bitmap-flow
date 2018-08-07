import * as crypto from 'crypto';
import { Db, MongoClient, ObjectID } from 'mongodb';
import { GridFsStorage } from '../../src/storage/gridfs-storage';

describe('GridFsStorage', () => {
    let storage: GridFsStorage;
    let client: MongoClient;
    let db: Db;

    beforeAll(async () => {
        client = await MongoClient.connect('mongodb://localhost:27017', {
            useNewUrlParser: true,
            reconnectTries: 0
        });
        db = client.db('bitmap-flow_test');
    });

    beforeEach(() => {
        storage = new GridFsStorage(db);
    });

    // Clean up
    afterEach(() => db.dropDatabase());
    afterAll(() => client.close());

    describe('type', () => {
        it('should always be "gridfs"', () => {
            expect(storage.type).toBe('gridfs');
        });
    });

    describe('upload', () => {
        it('should upload some data', async () => {
            const data = Buffer.from([0x00]);
            const summary = await storage.upload(data);
            expect(summary.type).toBe(storage.type);
            expect(typeof summary.id).toBe('string');
        });
    });

    describe('read', () => {
        it('should send back exactly the data that was uploaded', async () => {
            const data = crypto.randomBytes(1024 * 1024);
            const { id } = await storage.upload(data);

            const readData = await storage.read(id);
            expect(readData.equals(data)).toBe(true);
        });

        it('should reject when the file ID doesn\'t exist', async () => {
            await expect(storage.read(new ObjectID().toHexString())).rejects.toBeDefined();
        });
    });

    describe('list', () => {
        it('should list all files in storage', async () => {
            expect(await storage.list()).toEqual([]);

            const ids: string[] = [];
            for (let i = 0; i < 10; i++) {
                const { id } = await storage.upload(crypto.randomBytes(1024));
                ids.push(id);
            }

            const list = await storage.list();
            expect(ids).toEqual(list);
        });
    });

    describe('exists', () => {
        it('should resolve to true if the file exists', async () => {
            const { id } = await storage.upload(crypto.randomBytes(1024));
            expect(await storage.exists(id)).toBe(true);
        });

        it('should resolve to false if the file does not exist', async () => {
            expect(await storage.exists(new ObjectID().toHexString())).toBe(false);
        });
    });

    describe('delete', () => {
        it('should reject if the files does not exist', async () => {
            await expect(storage.delete(new ObjectID().toHexString())).rejects.toBeDefined();
        });

        it('should delete the specified file if it exists', async () => {
            const { id } = await storage.upload(crypto.randomBytes(1024));
            await storage.delete(id);
            expect(await storage.exists(id)).toBe(false);
        });
    });
});
