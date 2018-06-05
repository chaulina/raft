"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RaftNode_1 = require("./RaftNode");
const httpRequest = require("request");
// configurations
const port1 = 3010;
const port2 = 3011;
const port3 = 3012;
const heartBeatTimeOut1 = 100;
const heartBeatTimeOut2 = 100;
const heartBeatTimeOut3 = 100;
const electionTimeOut1 = 175;
const electionTimeOut2 = 200;
const electionTimeOut3 = 225;
const baseUrl = 'http://localhost';
const url1 = baseUrl + ':' + port1;
const url2 = baseUrl + ':' + port2;
const url3 = baseUrl + ':' + port3;
// create nodes
let node1 = new RaftNode_1.default(port1, heartBeatTimeOut1, electionTimeOut1, baseUrl);
let node2 = new RaftNode_1.default(port2, heartBeatTimeOut2, electionTimeOut2, baseUrl);
let node3 = new RaftNode_1.default(port3, heartBeatTimeOut3, electionTimeOut3, baseUrl);
let server1, server2, server3;
// RUN ALL NODES
it('run node1', (done) => {
    server1 = node1.run(() => {
        expect(server1.listening).toBeTruthy();
        done();
    });
});
it('run node2', (done) => {
    server2 = node2.run(() => {
        expect(server2.listening).toBeTruthy();
        done();
    });
});
it('run node3', (done) => {
    server3 = node3.run(() => {
        expect(server3.listening).toBeTruthy();
        done();
    });
});
// ADD NODES 1
it('add node2 to node1', (done) => {
    httpRequest(`${url1}/addFellow?nodeUrl=${url2}`, (error, response, body) => {
        let result = JSON.parse(body);
        expect(result).toBeTruthy();
        done();
    });
});
it('add node2 to node1 again', (done) => {
    httpRequest(`${url1}/addFellow?nodeUrl=${url2}`, (error, response, body) => {
        let result = JSON.parse(body);
        expect(result).toBeFalsy();
        done();
    });
});
it('add node3 to node1', (done) => {
    httpRequest(`${url1}/addFellow?nodeUrl=${url3}`, (error, response, body) => {
        let result = JSON.parse(body);
        expect(result).toBeTruthy();
        done();
    });
});
it('confirm that node1 has two fellows', (done) => {
    httpRequest(`${url1}/showFellows`, (error, response, body) => {
        let result = JSON.parse(body);
        expect(result.length).toBe(2);
        done();
    });
});
// CLOSE ALL NODES
it('close node1', (done) => {
    server1.close(() => {
        expect(server1.listening).toBeFalsy();
        done();
    });
});
it('close node2', (done) => {
    server2.close(() => {
        expect(server2.listening).toBeFalsy();
        done();
    });
});
it('close node3', (done) => {
    server3.close(() => {
        expect(server3.listening).toBeFalsy();
        done();
    });
});
