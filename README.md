# idspy 🚀

`idspy` is a simple and easy-to-use networking tool designed to simplify basic tasks. This command-line utility provides information about your current network and host, along with fetching public IP data.

The utility is written in Node.js and is deployable on any system supporting Node.js.

## Installation 🛠️

Make sure you have Node.js installed on your system. Then, install `idspy` globally using npm:

```bash
npm install -g idspy
```

## Usage 📖

To fetch host data, simply run the command without any arguments:

```bash
idspy
```

This will output information about your current host, including the username, device name, CPU, OS, total memory, private IP address, and public IP address.

To fetch IP data, pass an IP address as an argument:

```bash
idspy 8.8.8.8
```

This will output information related to the IP address, including the city, region, country, ZIP, and ISP.

`idspy` can identify IPv4 and IPv6 addresses as well as domains. If the input is not recognized as any of these, an error message will be shown with information on the correct formats.


## Security 🔒
idspy prioritizes the security and privacy of its users. While it fetches public IP data, it does not store any information. Users should ensure their Node.js environment is secure and up to date.

## Contribution 🤝

Feel free to contribute to this project by submitting issues or pull requests for bugs and features.

## License 📜

MIT License

> [!CAUTION]
> Please use this tool responsibly. Fetching public IP data is meant for legitimate use cases like debugging and troubleshooting.

