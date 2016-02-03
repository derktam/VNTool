/**
 * Created by Minhyeong on 2016-01-23.
 */
var pg = require('pg');
var psql_ip = '127.0.0.1';
var psql_port = '5432';
var id = 'postgres';
var pw = 'comtrue';
var conString = "postgres://"+id+":"+pw+"@localhost/srm_new";


var check_client = function(pbip,cb){
    pg.connect(conString, function(err, client, done) {
        if(err) {
            cb(null);
            return console.error('error fetching client from pool', err);
        }
        pbip = pbip.replace(/:/gi,"");
        pbip = pbip.replace(/f/gi,"");
        client.query('SELECT * FROM clients WHERE public_ip = $1',[pbip], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                cb(null);
                return console.error('error running query', err);
            }

            if(result.rows.length == 0)
                cb(null,false);
            else
                cb(null,true,result.rows[0].name);
        });
    });
}

var check_name = function(name,cb){
    pg.connect(conString, function(err, client, done) {
        if(err) {
            cb(null,false);
            return console.error('error fetching client from pool', err);
        }

        name = name.replace(/\n/gi,"");

        client.query('SELECT * FROM clients WHERE name = $1',[name], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                cb(null,false);
                return console.error('error running query', err);
            }

            if(result.rows.length == 0)
                cb(null,true);
            else
                cb(null,false);
        });
    });
}

var insert_client = function(name, pbip, check, cb){
    pg.connect(conString, function(err, client, done) {
        if(err) {
            cb(null,false);
            return console.error('error fetching client from pool', err);
        }
        pbip = pbip.replace(/:/gi,"");
        pbip = pbip.replace(/f/gi,"");
        name = name.replace(/\n/gi,"");

        client.query('INSERT INTO clients (name, public_ip, private_ip) VALUES($1, $2, $3)', [name, pbip, '127.0.0.1'], function(err, result) {
            //call `done()` to release the client back to the pool
            done();

            if(err) {
                cb(null,check);
                return console.error('error running query', err);
            }
            cb(null,check,name);
        });
    });
}

module.exports = {
    check_client:check_client,
    check_name:check_name,
    insert_client:insert_client
};