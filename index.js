#!/usr/bin/env node

import os from 'os';
import {publicIp, publicIpv4, publicIpv6} from 'public-ip';

function getPrivateIPv4() {
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

async function getPublicIPv4() {
    return publicIpv4();
}

console.log("\n")
console.log(`User: ${os.userInfo().username}`);
console.log(`Device Name: ${os.hostname()}`);
console.log(`CPU: ${os.cpus()[0].model}`);
console.log(`OS: ${os.type()} ${os.release()}`);
console.log(`Total Memory: ${os.totalmem() / 1024 / 1024 / 1024} GB`);
console.log(`Private IP Address: ${getPrivateIPv4()}`);
console.log(`Public IP Address: ${await getPublicIPv4()}`);
console.log("\n")