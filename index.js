#!/usr/bin/env node

import os from 'os';
import {publicIp, publicIpv4, publicIpv6} from 'public-ip';
import fetch from 'node-fetch';
import chalk from 'chalk'

(async function init(){
    if (process.argv.length < 3) {
        output(await fetchHost());
    } else {
        let thirdArg = process.argv[2];
        
        if (identifyString(thirdArg) === 'IPv4' || identifyString(thirdArg) === 'IPv6') 
            output(await fetchIP(thirdArg));
        else if (identifyString(thirdArg) === 'Domain') {
            console.log("Domain capabilities not yet implemented");
        } else if (identifyString(thirdArg) === 'None of the above') {
            console.log(chalk.bgRed.whiteBright.bold("\nInvalid Input. Please enter a valid IPv4, IPv6, or Domain."));
        
            const ipDataMap = new Map([
            ['IPv4 Format', 'xxx.xxx.xxx.xxx'],
            ['IPv6 Format', 'xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx'],
            ['Domain Format', '(www).example.com']
            ]);
    
            output(ipDataMap);
        }      
    }
})();

async function fetchHost(){
    const ipDataMap = new Map();

    ipDataMap.set('Username', os.userInfo().username);
    ipDataMap.set('Device Name', os.hostname());
    ipDataMap.set('CPU', os.cpus()[0].model);
    ipDataMap.set('OS', `${os.type()} ${os.release()}`);
    ipDataMap.set('Total Memory', `${os.totalmem() / 1024 / 1024 / 1024} GB`);


    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipDataMap.set('Private IP Address', alias.address);
            }
        }
    }

    try {
        const publicIP = await publicIpv4();
        ipDataMap.set('Public IP Address', publicIP);
    } catch (error) {
        console.error('Error: Cannot find Public IP Address', error);
    }
    
    return ipDataMap;
}

async function fetchIP(ip) {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      
      const ipDataMap = new Map();
      ipDataMap.set('IP', data.query);
      ipDataMap.set('City', data.city);
      ipDataMap.set('Region', data.regionName);
      ipDataMap.set('Country', data.country);
      ipDataMap.set('ZIP', data.zip);
      ipDataMap.set('ISP', data.isp);
      
      return ipDataMap;
  
    } catch (error) {
      console.error('Error:', error);
    }
  }

function identifyString(str) {
    const ipv4RegExp = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6RegExp = /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$/;
    const domainRegExp = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    
    if (ipv4RegExp.test(str)) {
      return 'IPv4';
    } else if (ipv6RegExp.test(str)) {
      return 'IPv6';
    } else if (domainRegExp.test(str)) {
      return 'Domain';
    } else {
      return 'None of the above';
    }
  }

function output(map) {
    console.log("\n");
    map.forEach((value, key) => {
      console.log(chalk.bold.blue(`${key}: `) + chalk.bold.whiteBright(`${value}`));
    });
    console.log("\n");
}