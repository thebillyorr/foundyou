#!/usr/bin/env node

import os from "os";
import { publicIp, publicIpv4, publicIpv6 } from "public-ip";
import fetch from "node-fetch";
import chalk from "chalk";


(async function init() {
  if (process.argv.length < 3) { //If no arguments are passed, return host data
    output(await fetchHost());
  } else {
    let thirdArg = process.argv[2];

    if(thirdArg === "-h" || thirdArg === "--help") { //If third argument is help, return help data
        printHelp();
        return;
    } 
    
    if(thirdArg === "-v" || thirdArg === "--version") { //If third argument is version, return version data
        printVersion();
        return;
    }  

    if ( //If third argument is IPv4 or IPv6, return IP data
      identifyString(thirdArg) === "IPv4" ||
      identifyString(thirdArg) === "IPv6"
    )
      output(await fetchIP(thirdArg)); 
    else if (identifyString(thirdArg) === "Domain") { //If third argument is domain, return domain data
      output(await fetchDomain(thirdArg));
    } else if (identifyString(thirdArg) === "None of the above") { //If third argument is not valid, return error
      const ipDataMap = new Map([
        ["Invalid Input:", "Please enter a valid IPv4, IPv6, or TLD."],
        ["\n", ""],
        ["IPv4 Format:", "xxx.xxx.xxx.xxx"],
        ["IPv6 Format:", "xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx"],
        ["TLD Format:", "(www).example.com"],
      ]);

      output(ipDataMap);
    }
  }
})();

async function fetchHost() {
  const ipDataMap = new Map();

  ipDataMap.set("Username:", os.userInfo().username);
  ipDataMap.set("Device Name:", os.hostname());
  ipDataMap.set("CPU:", os.cpus()[0].model);
  ipDataMap.set("OS:", `${os.type()} ${os.release()}`);
  ipDataMap.set("Total Memory:", `${os.totalmem() / 1024 / 1024 / 1024} GB`);

  const interfaces = os.networkInterfaces();
  for (let interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        ipDataMap.set("Private IP Address:", alias.address);
      }
    }
  }

  try {
    const publicIP = await publicIpv4();
    ipDataMap.set("Public IP Address:", publicIP);
  } catch (error) {
    console.error("Error: Cannot find Public IP Address", error);
  }

  return ipDataMap;
}

async function fetchIP(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    const ipDataMap = new Map();
    ipDataMap.set("IP:", data.query);
    ipDataMap.set("City:", data.city);
    ipDataMap.set("Region:", data.regionName);
    ipDataMap.set("Country:", data.country);
    ipDataMap.set("ZIP:", data.zip);
    ipDataMap.set("Owner:", data.isp);

    return ipDataMap;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchDomain(domain) {
  const protocolPrefixes = ["https://", "http://"]; //Remove protocol prefix if it exists

  for (const prefix of protocolPrefixes) {
    if (domain.startsWith(prefix)) {
      domain = domain.replace(prefix, "");
      break;
    }
  }

  const defaultApiKey = "Tl2lRyYr7ziJkOgK/y4NnQ==NksbjGN2AL5kRUUl"; //Free API Key
  const headers = { //Headers for API Calls
    "X-Api-Key": defaultApiKey,
  };
  const domainDataMap = new Map(); //Map to store domain data

  //NSLOOKUP
  try {
    domainDataMap.set("NSLOOKUP", "");
    const apiUrl = `https://api.api-ninjas.com/v1/dnslookup?domain=${domain}`;
    const response = await fetch(apiUrl, { headers });

    let data = await response.json();

    if (!data || Object.keys(data).length === 0) { //If no data is returned, return error
        domainDataMap.set("Error:", "This Domain Is Not Registered or Is Malformed");
        return domainDataMap;
    }

    let index = 1;
    let currentRecordType = data[0].record_type; 

    data.forEach(async (record) => {
      let recordType = record.record_type; //A, AAAA, CNAME, MX, NS, SOA, TXT
      let value = recordType === `SOA` ? record.mname : record.value; //Special Case for SOA Record

      if (recordType !== currentRecordType) { //If record type changes, reset index
        index = 1;
        currentRecordType = recordType;
      }

      let key = index === 1 ? recordType : `${recordType}-${index}`; //If index is 1, don't add index to key (First time seeing record type)
      domainDataMap.set(`${key}:`, value);

      index++;
    });

    let tempMap = await fetchIP(domainDataMap.get("A:")); //Fetch IP for A Record
    domainDataMap.set("A Record Owner:", tempMap.get("Owner:")); 
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }

  //WHOIS
  try {
    domainDataMap.set("\n", "");
    domainDataMap.set("WHOIS", "");

    const apiUrl = `https://api.api-ninjas.com/v1/whois?domain=${domain}`;
    const response = await fetch(apiUrl, { headers });
    if (response.status !== 200) { //If response is not 200, return error. This will happen for goofy TLD's (.xyz)
        domainDataMap.set(`${response.status} ${response.statusText}:`,`WHOIS LOOKUP FAILED FOR ${domain}`,);
        return domainDataMap;
    }
    const data = await response.json();

    if (!data || Object.keys(data).length === 0) { //If no data is returned, return error. This will happen for subdomains sometimes
        domainDataMap.set("Error:", "WHOIS Failed - Malformed Domain Name");
        return domainDataMap;
    }

    domainDataMap.set("Registrar:", data.registrar);
    domainDataMap.set("Creation Date:", convertUnixTime(data.creation_date));
    domainDataMap.set("Last Updated:", convertUnixTime(data.updated_date));
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }

  return domainDataMap;
}

function identifyString(str) {
  const ipv4RegExp =
    /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6RegExp =
    /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$/;
  const domainRegExp = /^(https?:\/\/)?([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

  if (ipv4RegExp.test(str)) {
    return "IPv4";
  } else if (ipv6RegExp.test(str)) {
    return "IPv6";
  } else if (domainRegExp.test(str)) {
    return "Domain";
  } else {
    return "None of the above";
  }
}

function convertUnixTime(timestamp) {
  const unixTime = parseInt(timestamp, 10) * 1000; // Convert to milliseconds
  const date = new Date(unixTime);

  const options = { month: "long", day: "numeric", year: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);

  return formattedDate;
}

function printHelp() {
    console.log(
        chalk.bgRed.whiteBright.bold(
          "\nDISCLAIMER. This tool is for educational purposes only. Use Responsibly."
        )
      );
    console.log("\n");
    console.log("Usage: idspy [options] <domain>");
    console.log("");
    console.log("Options:");
    console.log("  -h, --help       Output usage information");
    //console.log("  -v, --version    Output the version number");
    console.log("");
    console.log("Examples:");
    console.log("  idspy example.com");
    console.log("  idspy 123.123.123.123");
    console.log("");
  }
  
function output(map) {
  console.log("\n");
  map.forEach((value, key) => {
    console.log(
      chalk.bold.blue(`${key} `) + chalk.bold.whiteBright(`${value}`)
    );
  });
  console.log("\n");
}
