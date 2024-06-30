/**
* @ts-nocheck   <!--GAMFC-->version base on commit 43fad05dcdae3b723c53c226f8181fc5bd47223e, time is 2023-06-22 15:20:05 UTC<!--GAMFC-END-->.
*   Last Update: 04:27 - sunday, 30 June 2024 by REvil
* Many thanks to https://github.com/cmliu/edgetunnel
*/
import { connect } from 'cloudflare:sockets';

// How to generate your own UUID: https://www.uuidgenerator.net/
// OR in the [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = 'uuid';

//Find proxyIP : https://github.com/NiREvil/vless/blob/main/sub/ProxyIP.md
//Find proxyIP : https://www.nslookup.io/domains/cdn-all.xn--b6gac.eu.org/dns-records/#google
let proxyIP = 'newproxy';//'cdn.xn--b6gac.eu.org, cdn-all.xn--b6gac.eu.org, workers.cloudflare.cyou'

let sub = 'subworkerhost';// Leave blank to use built-in subscription
let subconverter = 'subapi-loadbalancing.pages.dev';// clash subscription conversion backend, currently uses CM's subscription conversion function. Comes with fake uuid and host subscription.
let subconfig = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini"; //Subscription Profile

// The user name and password do not contain special characters
// Setting the address will ignore proxyIP
// Example:  user:pass@host:port  or  host:port
let socks5Address = '';

if (!isValidUUID(userID)) {
	throw new Error('uuid is not valid');
}

let parsedSocks5Address = {}; 
let enableSocks = false;

// Fake uuid and hostname, used to send to the configuration generation service
let fakeUserID ;
let fakeHostName ;
let noTLS = 'false'; 
const expire = 4102329600;//2099-12-31
let proxyIPs;
let addresses = [];
let addressesapi = [];
let addressesnotls = [];
let addressesnotlsapi = [];
let addressescsv = [];
let DLS = 8;
let FileName = 'edgetunnel';
let BotToken ='';
let ChatID =''; 
let proxyhosts = [];//Local proxy domain name pool
let proxyhostsURL = 'https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts';//在线代理域名池URL
let RproxyIP = 'false';
export default {
	/**
	 * @param {import("@cloudflare/workers-types").Request} request
	 * @param {{UUID: string, PROXYIP: string}} env
	 * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */
	async fetch(request, env, ctx) {
		try {
			const UA = request.headers.get('User-Agent') || 'null';
			const userAgent = UA.toLowerCase();
			userID = (env.UUID || userID).toLowerCase();

			const currentDate = new Date();
			currentDate.setHours(0, 0, 0, 0); 
			const timestamp = Math.ceil(currentDate.getTime() / 1000);
			const fakeUserIDMD5 = await MD5MD5(`${userID}${timestamp}`);
			fakeUserID = fakeUserIDMD5.slice(0, 8) + "-" + fakeUserIDMD5.slice(8, 12) + "-" + fakeUserIDMD5.slice(12, 16) + "-" + fakeUserIDMD5.slice(16, 20) + "-" + fakeUserIDMD5.slice(20);
			fakeHostName = fakeUserIDMD5.slice(6, 9) + "." + fakeUserIDMD5.slice(13, 19);
			//console.log(`${fakeUserID}\n${fakeHostName}`); // Print fakeID

			proxyIP = env.PROXYIP || proxyIP;
			proxyIPs = await ADD(proxyIP);
			proxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
			//console.log(proxyIP);
			socks5Address = env.SOCKS5 || socks5Address;
			sub = env.SUB || sub;
			subconverter = env.SUBAPI || subconverter;
			subconfig = env.SUBCONFIG || subconfig;
			if (socks5Address) {
				try {
					parsedSocks5Address = socks5AddressParser(socks5Address);
					RproxyIP = env.RPROXYIP || 'false';
					enableSocks = true;
				} catch (err) {
  					/** @type {Error} */ 
					let e = err;
					console.log(e.toString());
					RproxyIP = env.RPROXYIP || !proxyIP ? 'true' : 'false';
					enableSocks = false;
				}
			} else {
				RproxyIP = env.RPROXYIP || !proxyIP ? 'true' : 'false';
			}
			if (env.ADD) addresses = await ADD(env.ADD);
			if (env.ADDAPI) addressesapi = await ADD(env.ADDAPI);
			if (env.ADDNOTLS) addressesnotls = await ADD(env.ADDNOTLS);
			if (env.ADDNOTLSAPI) addressesnotlsapi = await ADD(env.ADDNOTLSAPI);
			if (env.ADDCSV) addressescsv = await ADD(env.ADDCSV);
			DLS = env.DLS || DLS;
			BotToken = env.TGTOKEN || BotToken;
			ChatID = env.TGID || ChatID; 
			const upgradeHeader = request.headers.get('Upgrade');
			const url = new URL(request.url);
			if (url.searchParams.has('sub') && url.searchParams.get('sub') !== '') sub = url.searchParams.get('sub');
			if (url.searchParams.has('notls')) noTLS = 'true';
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				// const url = new URL(request.url);
				switch (url.pathname.toLowerCase()) {
				case '/':
					const envKey = env.URL302 ? 'URL302' : (env.URL ? 'URL' : null);
					if (envKey) {
						const URLs = await ADD(env[envKey]);
						const URL = URLs[Math.floor(Math.random() * URLs.length)];
						return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
					}
					return new Response(JSON.stringify(request.cf, null, 4), { status: 200 });
				case `/${fakeUserID}`:
					const fakeConfig = await getVLESSConfig(userID, request.headers.get('Host'), sub, 'CF-Workers-SUB', RproxyIP, url);
					return new Response(`${fakeConfig}`, { status: 200 });
				case `/${userID}`: {
					await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${UA}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
					if ((!sub || sub == '') && (addresses.length + addressesapi.length + addressesnotls.length + addressesnotlsapi.length + addressescsv.length) == 0){
						if (request.headers.get('Host').includes(".workers.dev")) {
							sub = 'workervless2sub-f1q.pages.dev'; 
							subconfig = 'https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online.ini';
						} else {
							sub = 'vless-4ca.pages.dev';
							subconfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini";
						}
					} 
					const vlessConfig = await getVLESSConfig(userID, request.headers.get('Host'), sub, UA, RproxyIP, url);
					const now = Date.now();
					//const timestamp = Math.floor(now / 1000);
					const today = new Date(now);
					today.setHours(0, 0, 0, 0);
					const UD = Math.floor(((now - today.getTime())/86400000) * 24 * 1099511627776 / 2);
					let pagesSum = UD;
					let workersSum = UD;
					let total = 24 * 1099511627776 ;
					if (env.CFEMAIL && env.CFKEY){
						const email = env.CFEMAIL;
						const key = env.CFKEY;
						const accountIndex = env.CFID || 0;
						const accountId = await getAccountId(email, key);
						if (accountId){
							const now = new Date()
							now.setUTCHours(0, 0, 0, 0)
							const startDate = now.toISOString()
							const endDate = new Date().toISOString();
							const Sum = await getSum(accountId, accountIndex, email, key, startDate, endDate);
							pagesSum = Sum[0];
							workersSum = Sum[1];
							total = 102400 ;
						}
					}
					//console.log(`pagesSum: ${pagesSum}\nworkersSum: ${workersSum}\ntotal: ${total}`);
					if (userAgent && userAgent.includes('mozilla')){
						return new Response(`${vlessConfig}`, {
							status: 200,
							headers: {
								"Content-Type": "text/plain;charset=utf-8",
								"Profile-Update-Interval": "6",
								"Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
							}
						});
					} else {
						return new Response(`${vlessConfig}`, {
							status: 200,
							headers: {
								"Content-Disposition": `attachment; filename=${FileName}; filename*=utf-8''${encodeURIComponent(FileName)}`,
								"Content-Type": "text/plain;charset=utf-8",
								"Profile-Update-Interval": "6",
								"Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`,
							}
						});
					}
				}
				default:
					return new Response('Not found', { status: 404 });
				}
			} else {
				proxyIP = url.searchParams.get('proxyip') || proxyIP;
				if (new RegExp('/proxyip=', 'i').test(url.pathname)) proxyIP = url.pathname.toLowerCase().split('/proxyip=')[1];
				else if (new RegExp('/proxyip.', 'i').test(url.pathname)) proxyIP = `proxyip.${url.pathname.toLowerCase().split("/proxyip.")[1]}`;
				
				socks5Address = url.searchParams.get('socks5') || socks5Address;
				if (new RegExp('/socks5=', 'i').test(url.pathname)) socks5Address = url.pathname.split('5=')[1];
				else if (new RegExp('/socks://', 'i').test(url.pathname) || new RegExp('/socks5://', 'i').test(url.pathname)) {
					socks5Address = url.pathname.split('://')[1].split('#')[0];
					if (socks5Address.includes('@')){
						let userPassword = socks5Address.split('@')[0];
						const base64Regex = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
						if (base64Regex.test(userPassword) && !userPassword.includes(':')) userPassword = atob(userPassword);
						socks5Address = `${userPassword}@${socks5Address.split('@')[1]}`;
					}
				}
				if (socks5Address) {
					try {
						parsedSocks5Address = socks5AddressParser(socks5Address);
						enableSocks = true;
					} catch (err) {
						/** @type {Error} */ 
						let e = err;
						console.log(e.toString());
						enableSocks = false;
					}
				} else {
					enableSocks = false;
				}
				return await vlessOverWSHandler(request);
			}
		} catch (err) {
			/** @type {Error} */ let e = err;
			return new Response(e.toString());
		}
	},
};

/**
 * 处理 VLESS over WebSocket 的请求
 * @param {import("@cloudflare/workers-types").Request} request
 */
async function vlessOverWSHandler(request) {

	/** @type {import("@cloudflare/workers-types").WebSocket[]} */
	// @ts-ignore
	const webSocketPair = new WebSocketPair();
	const [client, webSocket] = Object.values(webSocketPair);

	//Accepting WebSocket Connections
	webSocket.accept();

	let address = '';
	let portWithRandomLog = '';
	// Log function, used to record connection information
	const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
		console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
	};
	// Get the early data header, which may contain some initialization data
	const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

	// Create a readable WebSocket stream to receive client data
	const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

	/** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
	// Wrapper for storing remote sockets
	let remoteSocketWapper = {
		value: null,
	};
	// Mark whether it is a DNS query
	let isDns = false;

	// WebSocket Pipeline for data flow to remote servers
	readableWebSocketStream.pipeTo(new WritableStream({
		async write(chunk, controller) {
			if (isDns) {
				// If it is a DNS query, call the DNS processing function
				return await handleDNSQuery(chunk, webSocket, null, log);
			}
			if (remoteSocketWapper.value) {
				// If there is a remote Socket, write data directly
				const writer = remoteSocketWapper.value.writable.getWriter()
				await writer.write(chunk);
				writer.releaseLock();
				return;
			}

			// 处理 VLESS 协议头部
			const {
				hasError,
				message,
				addressType,
				portRemote = 443,
				addressRemote = '',
				rawDataIndex,
				vlessVersion = new Uint8Array([0, 0]),
				isUDP,
			} = processVlessHeader(chunk, userID);
			// Set address and port information for logging
			address = addressRemote;
			portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '} `;
			if (hasError) {
				// If there is an error, throw an exception
				throw new Error(message);
				return;
			}
			// If it is UDP and the port is not the DNS port (53), close the connection
			if (isUDP) {
				if (portRemote === 53) {
					isDns = true;
				} else {
					throw new Error('UDP 代理仅对 DNS（53 端口）启用');
					return;
				}
			}
			// Constructing VLESS response header
			const vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
			// Get the actual client data
			const rawClientData = chunk.slice(rawDataIndex);

			if (isDns) {
				// If it is a DNS query, call the DNS processing function
				return handleDNSQuery(rawClientData, webSocket, vlessResponseHeader, log);
			}
			// Handling TCP outbound connections
			log(`处理 TCP 出站连接 ${addressRemote}:${portRemote}`);
			handleTCPOutBound(remoteSocketWapper, addressType, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log);
		},
		close() {
			log(`readableWebSocketStream 已关闭`);
		},
		abort(reason) {
			log(`readableWebSocketStream 已中止`, JSON.stringify(reason));
		},
	})).catch((err) => {
		log('readableWebSocketStream 管道错误', err);
	});

	// Returns a WebSocket upgrade response
	return new Response(null, {
		status: 101,
		// @ts-ignore
		webSocket: client,
	});
}

/**
 * 处理出站 TCP 连接。
 *
 * @param {any} remoteSocket 远程 Socket 的包装器，用于存储实际的 Socket 对象
 * @param {number} addressType 要连接的远程地址类型（如 IP 类型：IPv4 或 IPv6）
 * @param {string} addressRemote 要连接的远程地址
 * @param {number} portRemote 要连接的远程端口
 * @param {Uint8Array} rawClientData 要写入的原始客户端数据
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket 用于传递远程 Socket 的 WebSocket
 * @param {Uint8Array} vlessResponseHeader VLESS 响应头部
 * @param {function} log 日志记录函数
 * @returns {Promise<void>} 异步操作的 Promise
 */
async function handleTCPOutBound(remoteSocket, addressType, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log,) {
	/**
	 * 连接远程服务器并写入数据
	 * @param {string} address 要连接的地址
	 * @param {number} port 要连接的端口
	 * @param {boolean} socks 是否使用 SOCKS5 代理连接
	 * @returns {Promise<import("@cloudflare/workers-types").Socket>} 连接后的 TCP Socket
	 */
	async function connectAndWrite(address, port, socks = false) {
		/** @type {import("@cloudflare/workers-types").Socket} */
		log(`connected to ${address}:${port}`);
		//if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(address)) address = `${atob('d3d3Lg==')}${address}${atob('LmlwLjA5MDIyNy54eXo=')}`;
		// 如果指定使用 SOCKS5 代理，则通过 SOCKS5 协议连接；否则直接连接
		const tcpSocket = socks ? await socks5Connect(addressType, address, port, log)
			: connect({
				hostname: address,
				port: port,
			});
		remoteSocket.value = tcpSocket;
		//log(`connected to ${address}:${port}`);
		const writer = tcpSocket.writable.getWriter();
		// First write, usually the TLS Client Hello message
		await writer.write(rawClientData);
		writer.releaseLock();
		return tcpSocket;
	}

	/**
	 * 重试函数：当 Cloudflare 的 TCP Socket 没有传入数据时，我们尝试重定向 IP
	 * 这可能是因为某些网络问题导致的连接失败
	 */
	async function retry() {
		if (enableSocks) {
			// If SOCKS5 is enabled, retry the connection through a SOCKS5 proxy
			tcpSocket = await connectAndWrite(addressRemote, portRemote, true);
		} else {
			// Otherwise, try to retry the connection using the preset proxy IP (if any) or the original address
			if (!proxyIP || proxyIP == '') proxyIP = atob('cHJveHlpcC5meHhrLmRlZHluLmlv');
			tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote);
		}
		// Regardless of whether the retry succeeds or not, close the WebSocket (possibly to reestablish the connection)
		tcpSocket.closed.catch(error => {
			console.log('retry tcpSocket closed error', error);
		}).finally(() => {
			safeCloseWebSocket(webSocket);
		})
		// Establishing data flow from remote socket to WebSocket
		remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null, log);
	}

	// First attempt to connect to the remote server
	let tcpSocket = await connectAndWrite(addressRemote, portRemote);

	// When the remote Socket is ready, pass it to the WebSocket
	// Establish a data stream from the remote server to the WebSocket to send the remote server's response back to the client
	// If the connection fails or there is no data, the retry function will be called to retry
	remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry, log);
}

/**
 * 将 WebSocket 转换为可读流（ReadableStream）
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer 服务器端的 WebSocket 对象
 * @param {string} earlyDataHeader WebSocket 0-RTT（零往返时间）的早期数据头部
 * @param {(info: string)=> void} log 日志记录函数，用于记录 WebSocket 0-RTT 相关信息
 * @returns {ReadableStream} 由 WebSocket 消息组成的可读流
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
	// Indicates whether the readable stream has been cancelled.
	let readableStreamCancel = false;

	// Create a new readable stream
	const stream = new ReadableStream({
		// Initialization function when the stream starts
		start(controller) {
			// Listen for WebSocket message events
			webSocketServer.addEventListener('message', (event) => {
				// If the stream has been cancelled, no new messages will be processed.
				if (readableStreamCancel) {
					return;
				}
				const message = event.data;
				// Add a message to the queue of a stream
				controller.enqueue(message);
			});

			// Listen for WebSocket close events
			// NOTE: This event means that the client has closed the client->server stream.
			// 但是，服务器 -> 客户端的流仍然打开，直到在服务器端调用 close()
			// WebSocket 协议要求在每个方向上都要发送单独的关闭消息，以完全关闭 Socket
			webSocketServer.addEventListener('close', () => {
				// The client sent a shutdown signal and the server needs to be shut down
				safeCloseWebSocket(webSocketServer);
				// If the stream is not cancelled, close the controller
				if (readableStreamCancel) {
					return;
				}
				controller.close();
			});

			// 监听 WebSocket 的错误事件
			webSocketServer.addEventListener('error', (err) => {
				log('WebSocket 服务器发生错误');
				// 将错误传递给控制器
				controller.error(err);
			});

			// 处理 WebSocket 0-RTT（零往返时间）的早期数据
			// 0-RTT 允许在完全建立连接之前发送数据，提高了效率
			const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
			if (error) {
				// 如果解码早期数据时出错，将错误传递给控制器
				controller.error(error);
			} else if (earlyData) {
				// 如果有早期数据，将其加入流的队列中
				controller.enqueue(earlyData);
			}
		},

		// 当使用者从流中拉取数据时调用
		pull(controller) {
			// 这里可以实现反压机制
			// 如果 WebSocket 可以在流满时停止读取，我们就可以实现反压
			// 参考：https://streams.spec.whatwg.org/#example-rs-push-backpressure
		},

		// 当流被取消时调用
		cancel(reason) {
			// 流被取消的几种情况：
			// 1. 当管道的 WritableStream 有错误时，这个取消函数会被调用，所以在这里处理 WebSocket 服务器的关闭
			// 2. 如果 ReadableStream 被取消，所有 controller.close/enqueue 都需要跳过
			// 3. 但是经过测试，即使 ReadableStream 被取消，controller.error 仍然有效
			if (readableStreamCancel) {
				return;
			}
			log(`可读流被取消，原因是 ${reason}`);
			readableStreamCancel = true;
			// 安全地关闭 WebSocket
			safeCloseWebSocket(webSocketServer);
		}
	});

	return stream;
}

// https://xtls.github.io/development/protocols/vless.html
// https://github.com/zizifn/excalidraw-backup/blob/main/v2ray-protocol.excalidraw

/**
 * 解析 VLESS 协议的头部数据
 * @param { ArrayBuffer} vlessBuffer VLESS 协议的原始头部数据
 * @param {string} userID 用于验证的用户 ID
 * @returns {Object} 解析结果，包括是否有错误、错误信息、远程地址信息等
 */
function processVlessHeader(vlessBuffer, userID) {
	// 检查数据长度是否足够（至少需要 24 字节）
	if (vlessBuffer.byteLength < 24) {
		return {
			hasError: true,
			message: 'invalid data',
		};
	}

	// Parse the VLESS protocol version (the first byte）
	const version = new Uint8Array(vlessBuffer.slice(0, 1));

	let isValidUser = false;
	let isUDP = false;

	// 验证用户 ID（接下来的 16 个字节）
	if (stringify(new Uint8Array(vlessBuffer.slice(1, 17))) === userID) {
		isValidUser = true;
	}
	// 如果用户 ID 无效，返回错误
	if (!isValidUser) {
		return {
			hasError: true,
			message: `invalid user ${(new Uint8Array(vlessBuffer.slice(1, 17)))}`,
		};
	}

	// 获取附加选项的长度（第 17 个字节）
	const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
	// 暂时跳过附加选项

	// 解析命令（紧跟在选项之后的 1 个字节）
	// 0x01: TCP, 0x02: UDP, 0x03: MUX（多路复用）
	const command = new Uint8Array(
		vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
	)[0];

	// 0x01 TCP
	// 0x02 UDP
	// 0x03 MUX
	if (command === 1) {
		// TCP 命令，不需特殊处理
	} else if (command === 2) {
		// UDP 命令
		isUDP = true;
	} else {
		// 不支持的命令
		return {
			hasError: true,
			message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
		};
	}

	// 解析远程端口（大端序，2 字节）
	const portIndex = 18 + optLength + 1;
	const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
	// port is big-Endian in raw data etc 80 == 0x005d
	const portRemote = new DataView(portBuffer).getUint16(0);

	// 解析地址类型和地址
	let addressIndex = portIndex + 2;
	const addressBuffer = new Uint8Array(
		vlessBuffer.slice(addressIndex, addressIndex + 1)
	);

	// 地址类型：1-IPv4(4字节), 2-域名(可变长), 3-IPv6(16字节)
	const addressType = addressBuffer[0];
	let addressLength = 0;
	let addressValueIndex = addressIndex + 1;
	let addressValue = '';

	switch (addressType) {
		case 1:
			// IPv4 地址
			addressLength = 4;
			// 将 4 个字节转为点分十进制格式
			addressValue = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			).join('.');
			break;
		case 2:
			// 域名
			// 第一个字节是域名长度
			addressLength = new Uint8Array(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
			)[0];
			addressValueIndex += 1;
			// 解码域名
			addressValue = new TextDecoder().decode(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			break;
		case 3:
			// IPv6 地址
			addressLength = 16;
			const dataView = new DataView(
				vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
			);
			// 每 2 字节构成 IPv6 地址的一部分
			const ipv6 = [];
			for (let i = 0; i < 8; i++) {
				ipv6.push(dataView.getUint16(i * 2).toString(16));
			}
			addressValue = ipv6.join(':');
			// seems no need add [] for ipv6
			break;
		default:
			// 无效的地址类型
			return {
				hasError: true,
				message: `invild addressType is ${addressType}`,
			};
	}

	// 确保地址不为空
	if (!addressValue) {
		return {
			hasError: true,
			message: `addressValue is empty, addressType is ${addressType}`,
		};
	}

	// 返回解析结果
	return {
		hasError: false,
		addressRemote: addressValue,  // 解析后的远程地址
		addressType,                 // 地址类型
		portRemote,                 // 远程端口
		rawDataIndex: addressValueIndex + addressLength,  // 原始数据的实际起始位置
		vlessVersion: version,      // VLESS 协议版本
		isUDP,                     // 是否是 UDP 请求
	};
}


/**
 * 将远程 Socket 的数据转发到 WebSocket
 * 
 * @param {import("@cloudflare/workers-types").Socket} remoteSocket 远程服务器的 Socket 连接
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket 客户端的 WebSocket 连接
 * @param {ArrayBuffer} vlessResponseHeader VLESS 协议的响应头部
 * @param {(() => Promise<void>) | null} retry 重试函数，当没有数据时调用
 * @param {*} log 日志函数
 */
async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retry, log) {
	// 将数据从远程服务器转发到 WebSocket
	let remoteChunkCount = 0;
	let chunks = [];
	/** @type {ArrayBuffer | null} */
	let vlessHeader = vlessResponseHeader;
	let hasIncomingData = false; // 检查远程 Socket 是否有传入数据

	// 使用管道将远程 Socket 的可读流连接到一个可写流
	await remoteSocket.readable
		.pipeTo(
			new WritableStream({
				start() {
					// 初始化时不需要任何操作
				},
				/**
				 * 处理每个数据块
				 * @param {Uint8Array} chunk 数据块
				 * @param {*} controller 控制器
				 */
				async write(chunk, controller) {
					hasIncomingData = true; // 标记已收到数据
					// remoteChunkCount++; // 用于流量控制，现在似乎不需要了

					// 检查 WebSocket 是否处于开放状态
					if (webSocket.readyState !== WS_READY_STATE_OPEN) {
						controller.error(
							'webSocket.readyState is not open, maybe close'
						);
					}

					if (vlessHeader) {
						// 如果有 VLESS 响应头部，将其与第一个数据块一起发送
						webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
						vlessHeader = null; // 清空头部，之后不再发送
					} else {
						// 直接发送数据块
						// 以前这里有流量控制代码，限制大量数据的发送速率
						// 但现在 Cloudflare 似乎已经修复了这个问题
						// if (remoteChunkCount > 20000) {
						// 	// cf one package is 4096 byte(4kb),  4096 * 20000 = 80M
						// 	await delay(1);
						// }
						webSocket.send(chunk);
					}
				},
				close() {
					// 当远程连接的可读流关闭时
					log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
					// 不需要主动关闭 WebSocket，因为这可能导致 HTTP ERR_CONTENT_LENGTH_MISMATCH 问题
					// 客户端无论如何都会发送关闭事件
					// safeCloseWebSocket(webSocket);
				},
				abort(reason) {
					// 当远程连接的可读流中断时
					console.error(`remoteConnection!.readable abort`, reason);
				},
			})
		)
		.catch((error) => {
			// 捕获并记录任何异常
			console.error(
				`remoteSocketToWS has exception `,
				error.stack || error
			);
			// 发生错误时安全地关闭 WebSocket
			safeCloseWebSocket(webSocket);
		});

	// 处理 Cloudflare 连接 Socket 的特殊错误情况
	// 1. Socket.closed 将有错误
	// 2. Socket.readable 将关闭，但没有任何数据
	if (hasIncomingData === false && retry) {
		log(`retry`);
		retry(); // 调用重试函数，尝试重新建立连接
	}
}

/**
 * 将 Base64 编码的字符串转换为 ArrayBuffer
 * 
 * @param {string} base64Str Base64 编码的输入字符串
 * @returns {{ earlyData: ArrayBuffer | undefined, error: Error | null }} 返回解码后的 ArrayBuffer 或错误
 */
function base64ToArrayBuffer(base64Str) {
	// 如果输入为空，直接返回空结果
	if (!base64Str) {
		return { error: null };
	}
	try {
		// Go 语言使用了 URL 安全的 Base64 变体（RFC 4648）
		// 这种变体使用 '-' 和 '_' 来代替标准 Base64 中的 '+' 和 '/'
		// JavaScript 的 atob 函数不直接支持这种变体，所以我们需要先转换
		base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
		
		// 使用 atob 函数解码 Base64 字符串
		// atob 将 Base64 编码的 ASCII 字符串转换为原始的二进制字符串
		const decode = atob(base64Str);
		
		// 将二进制字符串转换为 Uint8Array
		// 这是通过遍历字符串中的每个字符并获取其 Unicode 编码值（0-255）来完成的
		const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
		
		// 返回 Uint8Array 的底层 ArrayBuffer
		// 这是实际的二进制数据，可以用于网络传输或其他二进制操作
		return { earlyData: arryBuffer.buffer, error: null };
	} catch (error) {
		// 如果在任何步骤中出现错误（如非法 Base64 字符），则返回错误
		return { error };
	}
}

/**
 * 这不是真正的 UUID 验证，而是一个简化的版本
 * @param {string} uuid 要验证的 UUID 字符串
 * @returns {boolean} 如果字符串匹配 UUID 格式则返回 true，否则返回 false
 */
function isValidUUID(uuid) {
	// 定义一个正则表达式来匹配 UUID 格式
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	
	// 使用正则表达式测试 UUID 字符串
	return uuidRegex.test(uuid);
}

// WebSocket 的两个重要状态常量
const WS_READY_STATE_OPEN = 1;     // WebSocket 处于开放状态，可以发送和接收消息
const WS_READY_STATE_CLOSING = 2;  // WebSocket 正在关闭过程中

/**
 * 安全地关闭 WebSocket 连接
 * 通常，WebSocket 在关闭时不会抛出异常，但为了以防万一，我们还是用 try-catch 包裹
 * @param {import("@cloudflare/workers-types").WebSocket} socket 要关闭的 WebSocket 对象
 */
function safeCloseWebSocket(socket) {
	try {
		// 只有在 WebSocket 处于开放或正在关闭状态时才调用 close()
		// 这避免了在已关闭或连接中的 WebSocket 上调用 close()
		if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
			socket.close();
		}
	} catch (error) {
		// 记录任何可能发生的错误，虽然按照规范不应该有错误
		console.error('safeCloseWebSocket error', error);
	}
}

// 预计算 0-255 每个字节的十六进制表示
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
	// (i + 256).toString(16) 确保总是得到两位数的十六进制
	// .slice(1) 删除前导的 "1"，只保留两位十六进制数
	byteToHex.push((i + 256).toString(16).slice(1));
}

/**
 * 快速地将字节数组转换为 UUID 字符串，不进行有效性检查
 * 这是一个底层函数，直接操作字节，不做任何验证
 * @param {Uint8Array} arr 包含 UUID 字节的数组
 * @param {number} offset 数组中 UUID 开始的位置，默认为 0
 * @returns {string} UUID 字符串
 */
function unsafeStringify(arr, offset = 0) {
	// Get the hexadecimal representation of each byte directly from the lookup table and concatenate them into UUID format
	// The grouping of 8-4-4-4-12 is achieved by carefully placed hyphens "-"
	// toLowerCase() ensures that the entire UUID is lowercase
	return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" +
		byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" +
		byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" +
		byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" +
		byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] +
		byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

/**
 * 将字节数组转换为 UUID 字符串，并验证其有效性
 * 这是一个安全的函数，它确保返回的 UUID 格式正确
 * @param {Uint8Array} arr 包含 UUID 字节的数组
 * @param {number} offset 数组中 UUID 开始的位置，默认为 0
 * @returns {string} 有效的 UUID 字符串
 * @throws {TypeError} 如果生成的 UUID 字符串无效
 */
function stringify(arr, offset = 0) {
	// Use unsafe functions to quickly generate UUID strings
	const uuid = unsafeStringify(arr, offset);
	// Verify that the generated UUID is valid
	if (!isValidUUID(uuid)) {
		// 原：throw TypeError("Stringified UUID is invalid");
		throw TypeError(`生成的 UUID 不符合规范 ${uuid}`); 
		//uuid = userID;
	}
	return uuid;
}

/**
 * 处理 DNS 查询的函数
 * @param {ArrayBuffer} udpChunk - 客户端发送的 DNS 查询数据
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket - 与客户端建立的 WebSocket 连接
 * @param {ArrayBuffer} vlessResponseHeader - VLESS 协议的响应头部数据
 * @param {(string)=> void} log - 日志记录函数
 */
async function handleDNSQuery(udpChunk, webSocket, vlessResponseHeader, log) {
    // 无论客户端发送到哪个 DNS 服务器，我们总是使用硬编码的服务器
    // 因为有些 DNS 服务器不支持 DNS over TCP
    try {
        // 选用 Google 的 DNS 服务器（注：后续可能会改为 Cloudflare 的 1.1.1.1）
        const dnsServer = '8.8.4.4'; // 在 Cloudflare 修复连接自身 IP 的 bug 后，将改为 1.1.1.1
        const dnsPort = 53; // DNS 服务的标准端口

        /** @type {ArrayBuffer | null} */
        let vlessHeader = vlessResponseHeader; // 保存 VLESS 响应头部，用于后续发送

        /** @type {import("@cloudflare/workers-types").Socket} */
        // 与指定的 DNS 服务器建立 TCP 连接
        const tcpSocket = connect({
            hostname: dnsServer,
            port: dnsPort,
        });

        log(`连接到 ${dnsServer}:${dnsPort}`); // 记录连接信息
        const writer = tcpSocket.writable.getWriter();
        await writer.write(udpChunk); // 将客户端的 DNS 查询数据发送给 DNS 服务器
        writer.releaseLock(); // 释放写入器，允许其他部分使用

        // 将从 DNS 服务器接收到的响应数据通过 WebSocket 发送回客户端
        await tcpSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                if (webSocket.readyState === WS_READY_STATE_OPEN) {
                    if (vlessHeader) {
                        // 如果有 VLESS 头部，则将其与 DNS 响应数据合并后发送
                        webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
                        vlessHeader = null; // 头部只发送一次，之后置为 null
                    } else {
                        // 否则直接发送 DNS 响应数据
                        webSocket.send(chunk);
                    }
                }
            },
            close() {
                log(`DNS 服务器(${dnsServer}) TCP 连接已关闭`); // 记录连接关闭信息
            },
            abort(reason) {
                console.error(`DNS 服务器(${dnsServer}) TCP 连接异常中断`, reason); // 记录异常中断原因
            },
        }));
    } catch (error) {
        // 捕获并记录任何可能发生的错误
        console.error(
            `handleDNSQuery 函数发生异常，错误信息: ${error.message}`
        );
    }
}

/**
 * 建立 SOCKS5 代理连接
 * @param {number} addressType 目标地址类型（1: IPv4, 2: 域名, 3: IPv6）
 * @param {string} addressRemote 目标地址（可以是 IP 或域名）
 * @param {number} portRemote 目标端口
 * @param {function} log 日志记录函数
 */
async function socks5Connect(addressType, addressRemote, portRemote, log) {
	const { username, password, hostname, port } = parsedSocks5Address;
	// 连接到 SOCKS5 代理服务器
	const socket = connect({
		hostname, // SOCKS5 服务器的主机名
		port,    // SOCKS5 服务器的端口
	});

	// 请求头格式（Worker -> SOCKS5 服务器）:
	// +----+----------+----------+
	// |VER | NMETHODS | METHODS  |
	// +----+----------+----------+
	// | 1  |    1     | 1 to 255 |
	// +----+----------+----------+

	// https://en.wikipedia.org/wiki/SOCKS#SOCKS5
	// METHODS 字段的含义:
	// 0x00 不需要认证
	// 0x02 用户名/密码认证 https://datatracker.ietf.org/doc/html/rfc1929
	const socksGreeting = new Uint8Array([5, 2, 0, 2]);
	// 5: SOCKS5 版本号, 2: 支持的认证方法数, 0和2: 两种认证方法（无认证和用户名/密码）

	const writer = socket.writable.getWriter();

	await writer.write(socksGreeting);
	log('已发送 SOCKS5 问候消息');

	const reader = socket.readable.getReader();
	const encoder = new TextEncoder();
	let res = (await reader.read()).value;
	// 响应格式（SOCKS5 服务器 -> Worker）:
	// +----+--------+
	// |VER | METHOD |
	// +----+--------+
	// | 1  |   1    |
	// +----+--------+
	if (res[0] !== 0x05) {
		log(`SOCKS5 服务器版本错误: 收到 ${res[0]}，期望是 5`);
		return;
	}
	if (res[1] === 0xff) {
		log("服务器不接受任何认证方法");
		return;
	}

	// 如果返回 0x0502，表示需要用户名/密码认证
	if (res[1] === 0x02) {
		log("SOCKS5 服务器需要认证");
		if (!username || !password) {
			log("请提供用户名和密码");
			return;
		}
		// 认证请求格式:
		// +----+------+----------+------+----------+
		// |VER | ULEN |  UNAME   | PLEN |  PASSWD  |
		// +----+------+----------+------+----------+
		// | 1  |  1   | 1 to 255 |  1   | 1 to 255 |
		// +----+------+----------+------+----------+
		const authRequest = new Uint8Array([
			1,                   // 认证子协议版本
			username.length,    // 用户名长度
			...encoder.encode(username), // 用户名
			password.length,    // 密码长度
			...encoder.encode(password)  // 密码
		]);
		await writer.write(authRequest);
		res = (await reader.read()).value;
		// 期望返回 0x0100 表示认证成功
		if (res[0] !== 0x01 || res[1] !== 0x00) {
			log("SOCKS5 服务器认证失败");
			return;
		}
	}

	// 请求数据格式（Worker -> SOCKS5 服务器）:
	// +----+-----+-------+------+----------+----------+
	// |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
	// +----+-----+-------+------+----------+----------+
	// | 1  |  1  | X'00' |  1   | Variable |    2     |
	// +----+-----+-------+------+----------+----------+
	// ATYP: 地址类型
	// 0x01: IPv4 地址
	// 0x03: 域名
	// 0x04: IPv6 地址
	// DST.ADDR: 目标地址
	// DST.PORT: 目标端口（网络字节序）

	// addressType
	// 1 --> IPv4  地址长度 = 4
	// 2 --> 域名
	// 3 --> IPv6  地址长度 = 16
	let DSTADDR;	// DSTADDR = ATYP + DST.ADDR
	switch (addressType) {
		case 1: // IPv4
			DSTADDR = new Uint8Array(
				[1, ...addressRemote.split('.').map(Number)]
			);
			break;
		case 2: // 域名
			DSTADDR = new Uint8Array(
				[3, addressRemote.length, ...encoder.encode(addressRemote)]
			);
			break;
		case 3: // IPv6
			DSTADDR = new Uint8Array(
				[4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]
			);
			break;
		default:
			log(`无效的地址类型: ${addressType}`);
			return;
	}
	const socksRequest = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]);
	// 5: SOCKS5版本, 1: 表示CONNECT请求, 0: 保留字段
	// ...DSTADDR: 目标地址, portRemote >> 8 和 & 0xff: 将端口转为网络字节序
	await writer.write(socksRequest);
	log('已发送 SOCKS5 请求');

	res = (await reader.read()).value;
	// 响应格式（SOCKS5 服务器 -> Worker）:
	//  +----+-----+-------+------+----------+----------+
	// |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
	// +----+-----+-------+------+----------+----------+
	// | 1  |  1  | X'00' |  1   | Variable |    2     |
	// +----+-----+-------+------+----------+----------+
	if (res[1] === 0x00) {
		log("SOCKS5 连接已建立");
	} else {
		log("SOCKS5 连接建立失败");
		return;
	}
	writer.releaseLock();
	reader.releaseLock();
	return socket;
}


/**
 * SOCKS5 代理地址解析器
 * 此函数用于解析 SOCKS5 代理地址字符串，提取出用户名、密码、主机名和端口号
 * 
 * @param {string} address SOCKS5 代理地址，格式可以是：
 *   - "username:password@hostname:port" （带认证）
 *   - "hostname:port" （不需认证）
 *   - "username:password@[ipv6]:port" （IPv6 地址需要用方括号括起来）
 */
function socks5AddressParser(address) {
	// 使用 "@" 分割地址，分为认证部分和服务器地址部分
	// reverse() 是为了处理没有认证信息的情况，确保 latter 总是包含服务器地址
	let [latter, former] = address.split("@").reverse();
	let username, password, hostname, port;

	// 如果存在 former 部分，说明提供了认证信息
	if (former) {
		const formers = former.split(":");
		if (formers.length !== 2) {
			throw new Error('无效的 SOCKS 地址格式：认证部分必须是 "username:password" 的形式');
		}
		[username, password] = formers;
	}

	// Parsing server address part
	const latters = latter.split(":");
	// Extract the port number from the end (because IPv6 addresses also contain colons）
	port = Number(latters.pop());
	if (isNaN(port)) {
		throw new Error('无效的 SOCKS 地址格式：端口号必须是数字');
	}

	// The remainder is the hostname (which may be a domain name, IPv4 or IPv6 address）
	hostname = latters.join(":");

	// Handling special cases for IPv6 addresses
	// IPv6 The address contains multiple colons, so it must be enclosed in square brackets, such as [2001:db8::1]
	const regex = /^\[.*\]$/;
	if (hostname.includes(":") && !regex.test(hostname)) {
		throw new Error('无效的 SOCKS 地址格式：IPv6 地址必须用方括号括起来，如 [2001:db8::1]');
	}

	//if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(hostname)) hostname = `${atob('d3d3Lg==')}${hostname}${atob('LmlwLjA5MDIyNy54eXo=')}`;
	// 返回解析后的结果
	return {
		username,  // Username, or if none undefined
		password,  // Password, if none undefined
		hostname,  // Host name, which can be a domain name、IPv4 或 IPv6 地址
		port,     // Port number, converted to numeric type

	}
}

/**
 * 恢复被伪装的信息
 * 这个函数用于将内容中的假用户ID和假主机名替换回真实的值
 * 
 * @param {string} content 需要处理的内容
 * @param {string} userID 真实的用户ID
 * @param {string} hostName 真实的主机名
 * @param {boolean} isBase64 内容是否是Base64编码的
 * @returns {string} 恢复真实信息后的内容
 */
function revertFakeInfo(content, userID, hostName, isBase64) {
	if (isBase64) content = atob(content);  // If the content is Base64 encoded, decode it first
	
	// Use regular expression global replacement ('g' flag)
	// Replace all occurrences of fake user IDs and fake hostnames with real values
	content = content.replace(new RegExp(fakeUserID, 'g'), userID)
	               .replace(new RegExp(fakeHostName, 'g'), hostName);
	
	if (isBase64) content = btoa(content);  // If the original content is Base64 encoded, encode it again after processing.
	
	return content;
}

/**
 * 双重MD5哈希函数
 * 这个函数对输入文本进行两次MD5哈希，增强安全性
 * 第二次哈希使用第一次哈希结果的一部分作为输入
 * 
 * @param {string} text 要哈希的文本
 * @returns {Promise<string>} 双重哈希后的小写十六进制字符串
 */
async function MD5MD5(text) {
	const encoder = new TextEncoder();
  
	// First MD5 hash
	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstPassArray = Array.from(new Uint8Array(firstPass));
	const firstHex = firstPassArray.map(b => b.toString(16).padStart(2, '0')).join('');

	// Second MD5 hash, using the middle part of the first hash result (indexes 7 to 26)
	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	const secondPassArray = Array.from(new Uint8Array(secondPass));
	const secondHex = secondPassArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
	return secondHex.toLowerCase();  // Returns a lowercase hexadecimal string
}

/**
 * 解析并清理环境变量中的地址列表
 * 这个函数用于处理包含多个地址的环境变量
 * 它会移除所有的空白字符、引号等，并将地址列表转换为数组
 * 
 * @param {string} envadd 包含地址列表的环境变量值
 * @returns {Promise<string[]>} 清理和分割后的地址数组
 */
async function ADD(envadd) {
	//Replace tabs, double quotes, single quotes, and newlines with commas
	// Then replace multiple commas in a row with a single comma
	var addtext = envadd.replace(/[	|"'\r\n]+/g, ',').replace(/,+/g, ',');
	
	// Remove leading and trailing commas (if any)

	if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == ',') addtext = addtext.slice(0, addtext.length - 1);
	
	// Use commas to split the string and get the address array
	const add = addtext.split(',');
	
	return add;
}

const 啥啥啥_写的这是啥啊 = 'dmxlc3M=';
function 配置信息(UUID, 域名地址) {
	const 协议类型 = atob(啥啥啥_写的这是啥啊);
	
	const 别名 = 域名地址;
	let 地址 = 域名地址;
	let 端口 = 443;

	const 用户ID = UUID;
	const 加密方式 = 'none';
	
	const 传输层协议 = 'ws';
	const 伪装域名 = 域名地址;
	const 路径 = '/?ed=2560';
	
	let 传输层安全 = ['tls',true];
	const SNI = 域名地址;
	const 指纹 = 'randomized';

	if (域名地址.includes('.workers.dev')){
		地址 = 'creativecommons.org';
		端口 = 80 ;
		传输层安全 = ['',false];
	}

	const v2ray = `${协议类型}://${用户ID}@${地址}:${端口}?encryption=${加密方式}&security=${传输层安全[0]}&sni=${SNI}&fp=${指纹}&type=${传输层协议}&host=${伪装域名}&path=${encodeURIComponent(路径)}#${encodeURIComponent(别名)}`;
	const clash = `- type: ${协议类型}
  name: ${别名}
  server: ${地址}
  port: ${端口}
  uuid: ${用户ID}
  network: ${传输层协议}
  tls: ${传输层安全[1]}
  udp: false
  sni: ${SNI}
  client-fingerprint: ${指纹}
  ws-opts:
    path: "${路径}"
    headers:
      host: ${伪装域名}`;
	return [v2ray,clash];
}

let subParams = ['sub','base64','b64','clash','singbox','sb'];

/**
 * @param {string} userID
 * @param {string | null} hostName
 * @param {string} sub
 * @param {string} UA
 * @returns {Promise<string>}
 */
async function getVLESSConfig(userID, hostName, sub, UA, RproxyIP, _url) {
	const userAgent = UA.toLowerCase();
	const Config = 配置信息(userID , hostName);
	const v2ray = Config[0];
	const clash = Config[1];
	let proxyhost = "";
	if(hostName.includes(".workers.dev") || hostName.includes(".pages.dev")){
		if ( proxyhostsURL && (!proxyhosts || proxyhosts.length == 0)) {
			try {
				const response = await fetch(proxyhostsURL); 
			
				if (!response.ok) {
					console.error('获取地址时出错:', response.status, response.statusText);
					return; // If there is an error, return directly
				}
			
				const text = await response.text();
				const lines = text.split('\n');
				// Filter out empty lines or lines containing only whitespace characters
				const nonEmptyLines = lines.filter(line => line.trim() !== '');
			
				proxyhosts = proxyhosts.concat(nonEmptyLines);
			} catch (error) {
				//console.error('获取地址时出错:', error);
			}
		} 
		if (proxyhosts.length != 0) proxyhost = proxyhosts[Math.floor(Math.random() * proxyhosts.length)] + "/";
	}

	if ( userAgent.includes('mozilla') && !subParams.some(_searchParams => _url.searchParams.has(_searchParams))) {
		let 订阅器 = `Your subscription is provided by ${sub} Provide maintenance support, Automatic acquisition ProxyIP: ${RproxyIP}`;
		if (!sub || sub == '') {
			if (!proxyIP || proxyIP =='') {
				订阅器 = 'Your subscription is built by addresses/ADD Parameters provided, , It is recommended that you set proxyIP/PROXYIP ！！';
			} else {
				订阅器 = `Your subscription is built by addresses/ADD Parameters provided, The currently used ProxyIP is empty: ${proxyIPs.join(', ')}`;
			}
		} else if (RproxyIP != 'true'){
			if (enableSocks) 订阅器 += `, Currently using Socks5: ${parsedSocks5Address.hostname}:${String(parsedSocks5Address.port)}`;
			else 订阅器 += `, The currently used ProxyIP is empty: ${proxyIPs.join(', ')}`;
		}
		return `
===========================================================
===========================================================
Subscription Address, Support, Base64、clash-meta、sing-box Subscription Format, ${订阅器}


Fast adaptive subscription address:
https://${proxyhost}${hostName}/${userID}
---------
https://${proxyhost}${hostName}/${userID}?sub

----------------------------------------------------------

Base64 Subscription Address:
https://${proxyhost}${hostName}/${userID}?b64
---------
https://${proxyhost}${hostName}/${userID}?base64

----------------------------------------------------------

Clash Subscription Address:
https://${proxyhost}${hostName}/${userID}?clash

----------------------------------------------------------

singbox Subscription Address:
https://${proxyhost}${hostName}/${userID}?sb
---------
https://${proxyhost}${hostName}/${userID}?singbox

===========================================================
v2ray

${v2ray}

===========================================================
clash-meta

${clash}

===========================================================
Telegram : https://t.me/F_NiREvil
GitHub : https://github.com/NiREvil/edgetunnel
===========================================================
===========================================================
`;
	} else {
		if (typeof fetch != 'function') {
			return 'Error: fetch is not available in this environment.';
		}

		let newAddressesapi ;
		let newAddressescsv ;
		let newAddressesnotlsapi;
		let newAddressesnotlscsv;

		// If the default domain name is used, change it to a workers domain name, and the subscriber will add a proxy
		if (hostName.includes(".workers.dev")){
			fakeHostName = `${fakeHostName}.workers.dev`;
			newAddressesnotlsapi = await getAddressesapi(addressesnotlsapi);
			newAddressesnotlscsv = await getAddressescsv('FALSE');
		} else if (hostName.includes(".pages.dev")){
			fakeHostName = `${fakeHostName}.pages.dev`;
		} else if (hostName.includes("worker") || hostName.includes("notls") || noTLS == 'true'){
			fakeHostName = `notls.${fakeHostName}.net`;
			newAddressesnotlsapi = await getAddressesapi(addressesnotlsapi);
			newAddressesnotlscsv = await getAddressescsv('FALSE');
		} else {
			fakeHostName = `${fakeHostName}.xyz`
		}

		let url = `https://${sub}/sub?host=${fakeHostName}&uuid=${fakeUserID}&edgetunnel=cmliu&proxyip=${RproxyIP}`;
		let isBase64 = true;

		if (!sub || sub == ""){
			if(hostName.includes('workers.dev') || hostName.includes('pages.dev')) {
				if (proxyhostsURL && (!proxyhosts || proxyhosts.length == 0)) {
					try {
						const response = await fetch(proxyhostsURL); 
					
						if (!response.ok) {
							console.error('获取地址时出错:', response.status, response.statusText);
							return; // If there is an error, return directly
						}
					
						const text = await response.text();
						const lines = text.split('\n');
						// Filter out empty lines or lines containing only whitespace characters
						const nonEmptyLines = lines.filter(line => line.trim() !== '');
					
						proxyhosts = proxyhosts.concat(nonEmptyLines);
					} catch (error) {
						console.error('获取地址时出错:', error);
					}
				}
				// Use Set object to remove duplicates
				proxyhosts = [...new Set(proxyhosts)];
			}
	
			newAddressesapi = await getAddressesapi(addressesapi);
			newAddressescsv = await getAddressescsv('TRUE');
			url = `https://${hostName}/${fakeUserID}`;
		} 

		if (!userAgent.includes(('CF-Workers-SUB').toLowerCase())){
			if ((userAgent.includes('clash') && !userAgent.includes('nekobox')) || ( _url.searchParams.has('clash') && !userAgent.includes('subconverter'))) {
				url = `https://${subconverter}/sub?target=clash&url=${encodeURIComponent(url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				isBase64 = false;
			} else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || (( _url.searchParams.has('singbox') || _url.searchParams.has('sb')) && !userAgent.includes('subconverter'))) {
				url = `https://${subconverter}/sub?target=singbox&url=${encodeURIComponent(url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				isBase64 = false;
			}
		}
		
		try {
			let content;
			if ((!sub || sub == "") && isBase64 == true) {
				content = await subAddresses(fakeHostName,fakeUserID,noTLS,newAddressesapi,newAddressescsv,newAddressesnotlsapi,newAddressesnotlscsv);
			} else {
				const response = await fetch(url ,{
					headers: {
						'User-Agent': `${UA} CF-Workers-edgetunnel/cmliu`
					}});
				content = await response.text();
			}
			if (!_url.pathname.includes(`/${fakeUserID}`)) content = revertFakeInfo(content, userID, hostName, isBase64);
			return content;
		} catch (error) {
			console.error('Error fetching content:', error);
			return `Error fetching content: ${error.message}`;
		}

	}
}

async function getAccountId(email, key) {
	try {
		const url = 'https://api.cloudflare.com/client/v4/accounts';
		const headers = new Headers({
			'X-AUTH-EMAIL': email,
			'X-AUTH-KEY': key
		});
		const response = await fetch(url, { headers });
		const data = await response.json();
		return data.result[0].id; // Suppose we need the first account ID
	} catch (error) {
		return false ;
	}
}

async function getSum(accountId, accountIndex, email, key, startDate, endDate) {
	try {
		const startDateISO = new Date(startDate).toISOString();
		const endDateISO = new Date(endDate).toISOString();
	
		const query = JSON.stringify({
			query: `query getBillingMetrics($accountId: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) {
				viewer {
					accounts(filter: {accountTag: $accountId}) {
						pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: $filter) {
							sum {
								requests
							}
						}
						workersInvocationsAdaptive(limit: 10000, filter: $filter) {
							sum {
								requests
							}
						}
					}
				}
			}`,
			variables: {
				accountId,
				filter: { datetime_geq: startDateISO, datetime_leq: endDateISO }
			},
		});
	
		const headers = new Headers({
			'Content-Type': 'application/json',
			'X-AUTH-EMAIL': email,
			'X-AUTH-KEY': key,
		});
	
		const response = await fetch(`https://api.cloudflare.com/client/v4/graphql`, {
			method: 'POST',
			headers: headers,
			body: query
		});
	
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
	
		const res = await response.json();
	
		const pagesFunctionsInvocationsAdaptiveGroups = res?.data?.viewer?.accounts?.[accountIndex]?.pagesFunctionsInvocationsAdaptiveGroups;
		const workersInvocationsAdaptive = res?.data?.viewer?.accounts?.[accountIndex]?.workersInvocationsAdaptive;
	
		if (!pagesFunctionsInvocationsAdaptiveGroups && !workersInvocationsAdaptive) {
			throw new Error('找不到数据');
		}
	
		const pagesSum = pagesFunctionsInvocationsAdaptiveGroups.reduce((a, b) => a + b?.sum.requests, 0);
		const workersSum = workersInvocationsAdaptive.reduce((a, b) => a + b?.sum.requests, 0);
	
		//console.log(`范围: ${startDateISO} ~ ${endDateISO}\n默认取第 ${accountIndex} 项`);
	
		return [pagesSum, workersSum ];
	} catch (error) {
		return [ 0,0 ];
	}
}

async function getAddressesapi(api) {
	if (!api || api.length === 0) {
		return [];
	}

	let newapi = "";

	// 创建一个AbortController对象，用于控制fetch请求的取消
	const controller = new AbortController();

	const timeout = setTimeout(() => {
		controller.abort(); // 取消所有请求
	}, 2000); // 2秒后触发

	try {
		// 使用Promise.allSettled等待所有API请求完成，无论成功或失败
		// 对api数组进行遍历，对每个API地址发起fetch请求
		const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, {
			method: 'get', 
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'User-Agent': 'CF-Workers-edgetunnel/cmliu'
			},
			signal: controller.signal // 将AbortController的信号量添加到fetch请求中，以便于需要时可以取消请求
		}).then(response => response.ok ? response.text() : Promise.reject())));

		// 遍历所有响应
		for (const response of responses) {
			// 检查响应状态是否为'fulfilled'，即请求成功完成
			if (response.status === 'fulfilled') {
				// 获取响应的内容
				const content = await response.value;
				newapi += content + '\n';
			}
		}
	} catch (error) {
		console.error(error);
	} finally {
		// Regardless of success or failure, the set timeout timer is finally cleared.
		clearTimeout(timeout);
	}

	const newAddressesapi = await ADD(newapi);

	// Return the processed result
	return newAddressesapi;
}

async function getAddressescsv(tls) {
	if (!addressescsv || addressescsv.length === 0) {
		return [];
	}
	
	let newAddressescsv = [];
	
	for (const csvUrl of addressescsv) {
		try {
			const response = await fetch(csvUrl);
		
			if (!response.ok) {
				console.error('获取CSV地址时出错:', response.status, response.statusText);
				continue;
			}
		
			const text = await response.text();// Parse text content using correct character encoding
			let lines;
			if (text.includes('\r\n')){
				lines = text.split('\r\n');
			} else {
				lines = text.split('\n');
			}
		
			// Check if the CSV header contains required fields
			const header = lines[0].split(',');
			const tlsIndex = header.indexOf('TLS');
			const speedIndex = header.length - 1; // last field
		
			const ipAddressIndex = 0;// The position of the IP address in the CSV header
			const portIndex = 1;// The position of the port in the CSV header
			const dataCenterIndex = tlsIndex + 1; // Datacenter is the latter field of TLS
		
			if (tlsIndex === -1) {
				console.error('CSV文件缺少必需的字段');
				continue;
			}
		
			// Iterate over CSV rows starting from the second row
			for (let i = 1; i < lines.length; i++) {
				const columns = lines[i].split(',');
		
				// Check if TLS is "TRUE" and faster than DLS
				if (columns[tlsIndex].toUpperCase() === tls && parseFloat(columns[speedIndex]) > DLS) {
					const ipAddress = columns[ipAddressIndex];
					const port = columns[portIndex];
					const dataCenter = columns[dataCenterIndex];
			
					const formattedAddress = `${ipAddress}:${port}#${dataCenter}`;
					newAddressescsv.push(formattedAddress);
				}
			}
		} catch (error) {
			console.error('获取CSV地址时出错:', error);
			continue;
		}
	}
	
	return newAddressescsv;
}

function subAddresses(host,UUID,noTLS,newAddressesapi,newAddressescsv,newAddressesnotlsapi,newAddressesnotlscsv) {
	const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[.*\]):?(\d+)?#?(.*)?$/;
	addresses = addresses.concat(newAddressesapi);
	addresses = addresses.concat(newAddressescsv);
	let notlsresponseBody ;
	if (noTLS == 'true'){
		addressesnotls = addressesnotls.concat(newAddressesnotlsapi);
		addressesnotls = addressesnotls.concat(newAddressesnotlscsv);
		const uniqueAddressesnotls = [...new Set(addressesnotls)];

		notlsresponseBody = uniqueAddressesnotls.map(address => {
			let port = "80";
			let addressid = address;
		
			const match = addressid.match(regex);
			if (!match) {
				if (address.includes(':') && address.includes('#')) {
					const parts = address.split(':');
					address = parts[0];
					const subParts = parts[1].split('#');
					port = subParts[0];
					addressid = subParts[1];
				} else if (address.includes(':')) {
					const parts = address.split(':');
					address = parts[0];
					port = parts[1];
				} else if (address.includes('#')) {
					const parts = address.split('#');
					address = parts[0];
					addressid = parts[1];
				}
			
				if (addressid.includes(':')) {
					addressid = addressid.split(':')[0];
				}
			} else {
				address = match[1];
				port = match[2] || port;
				addressid = match[3] || address;
			}

			const httpPorts = ["8080","8880","2052","2082","2086","2095"];
			if (!isValidIPv4(address) && port == "80") {
				for (let httpPort of httpPorts) {
					if (address.includes(httpPort)) {
						port = httpPort;
						break;
					}
				}
			}
			
			let 伪装域名 = host ;
			let 最终路径 = '/?ed=2560' ;
			let 节点备注 = '';
			
			if(proxyhosts.length > 0 && (伪装域名.includes('.workers.dev') || 伪装域名.includes('pages.dev'))) {
				最终路径 = `/${伪装域名}${最终路径}`;
				伪装域名 = proxyhosts[Math.floor(Math.random() * proxyhosts.length)];
				节点备注 = ` Temporary domain name forwarding service enabled，please bind a custom domain as soon as possible！`;
			}

			const vlessLink = `vless://${UUID}@${address}:${port}?encryption=none&security=&type=ws&host=${伪装域名}&path=${encodeURIComponent(最终路径)}#${encodeURIComponent(addressid + 节点备注)}`;
	
			return vlessLink;

		}).join('\n');

	}

	// Use Set object to remove duplicates
	const uniqueAddresses = [...new Set(addresses)];

	const responseBody = uniqueAddresses.map(address => {
		let port = "443";
		let addressid = address;

		const match = addressid.match(regex);
		if (!match) {
			if (address.includes(':') && address.includes('#')) {
				const parts = address.split(':');
				address = parts[0];
				const subParts = parts[1].split('#');
				port = subParts[0];
				addressid = subParts[1];
			} else if (address.includes(':')) {
				const parts = address.split(':');
				address = parts[0];
				port = parts[1];
			} else if (address.includes('#')) {
				const parts = address.split('#');
				address = parts[0];
				addressid = parts[1];
			}
		
			if (addressid.includes(':')) {
				addressid = addressid.split(':')[0];
			}
		} else {
			address = match[1];
			port = match[2] || port;
			addressid = match[3] || address;
		}

		const httpsPorts = ["2053","2083","2087","2096","8443"];
		if (!isValidIPv4(address) && port == "443") {
			for (let httpsPort of httpsPorts) {
				if (address.includes(httpsPort)) {
					port = httpsPort;
					break;
				}
			}
		}
		
		let 伪装域名 = host ;
		let 最终路径 = '/?ed=2560' ;
		let 节点备注 = '';
		
		if(proxyhosts.length > 0 && (伪装域名.includes('.workers.dev') || 伪装域名.includes('pages.dev'))) {
			最终路径 = `/${伪装域名}${最终路径}`;
			伪装域名 = proxyhosts[Math.floor(Math.random() * proxyhosts.length)];
			节点备注 = ` Temporary domain name forwarding service enabled，please bind a custom domain as soon as possible！`;
		}
		
		const 协议类型 = atob(啥啥啥_写的这是啥啊);
		const vlessLink = `${协议类型}://${UUID}@${address}:${port}?encryption=none&security=tls&sni=${伪装域名}&fp=random&type=ws&host=${伪装域名}&path=${encodeURIComponent(最终路径)}#${encodeURIComponent(addressid + 节点备注)}`;
			
		return vlessLink;
	}).join('\n');

	let base64Response = responseBody; // 重新进行 Base64 编码
	if(noTLS == 'true') base64Response += `\nnotlsresponseBody`;
	return btoa(base64Response);
}

async function sendMessage(type, ip, add_data = "") {
	if ( BotToken !== '' && ChatID !== ''){
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}
	
		let url = "https://api.telegram.org/bot"+ BotToken +"/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

function isValidIPv4(address) {
	const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	return ipv4Regex.test(address);
}
