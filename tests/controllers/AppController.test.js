import {
    expect
}
from 'chai';
import request from 'request';
import dbClient from '../../utils/db';
const url = 'http://0.0.0.0:5000';
describe('AppController', () => {
    beforeEach(function(done) {
        this.timeout(1000);
        dbClient.clear().then((result) => {
            done();
        });
    });
    describe('GET /status', () => {
        it('Services are online', (done) => {
            request.get(`${url}/status`, (err, res, body) => {
                if (err) return done(err);
                expect(res.statusCode).to.be.equal(200);
                expect(body).to.deep.equal('{"redis":true,"db":true}');
                done();
            });
        });
    });
    describe('Get stats', () => {
        it('correct stats of users and files in the DB', (done) => {
            request.get(`${url}/stats`, (err, res, body) => {
                if (err) return done(err);
                expect(res.statusCode).to.be.equal(200);
                expect(JSON.parse(body)).to.deep.equal({
                    users: 0,
                    files: 0
                });
                done();
            });
        });
        it('correct stats about db collections', async function() {
            this.timeout(1000);
            try {
                await dbClient.insertManyUsers([{
                    email: 'john@mail.com'
                }]);
                await dbClient.insertManyFiles([{
                    name: 'foo.txt',
                    type: 'file'
                }, {
                    name: 'bar.png',
                    type: 'image'
                }, ]);
            } catch (err) {
                console.error(err);
            }
            request.get(`${url}/stats`, (err, res, body) => {
                if (err) console.err(err);
                expect(res.statusCode).to.be.equal(200);
            });
        });
    });
});
