
// After the deployment is completed, add this after the URL to obtain the default node of the subscriber./auto

let mytoken= 'username';


let addresses = [
	"icook.hk:2083#CFW -1",
	"zula.ir:443#CFW -2",
	"vista.com:2053#CFW -3",
	"www.csgo.com:8443#CFW -4",
	"sky.rethinkdns.com:2053#CFW -5",
	"www.speedtest.net:443#CFW -6",
	"time.cloudflare.com:2053#CFW -7",
	"go.inmobi.com:2053#CFW -8",
	"creativecommons.org:443#CFW -9",
	"time.cloudflare.com:8443#CFW -10",
	"www.csgo.com:2083#CFW -10",
];

// addresses api
// let addressesapi = ['https://raw.githubusercontent.com/NiREvil/CFW-BOT/main/ips.txt'];
let addressesapi = ['addressapi'];

let DLS = 4;
let addressescsv = [
	//'https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/addressescsv.csv' //iptest。
];

let subconverter = "subapi-loadbalancing.pages.dev"; //The online subscription conversion backend currently uses Feiyang's subscription conversion function. Supports self-built psub and can be built by yourselfhttps://github.com/bulianglin/psub
let subconfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini"; 

let link = '';
let edgetunnel = 'ed';
let RproxyIP = 'false';
let proxyIPs = [
	'proxyip.aliyun.fxxk.dedyn.io',
	'proxyip.multacom.fxxk.dedyn.io',
	'proxyip.vultr.fxxk.dedyn.io',
];
let CMproxyIPs = [
	{ proxyIP: "proxyip.fxxk.dedyn.io", type: "HK" },
];
let BotToken ='';
let ChatID =''; 
let proxyhosts = [

];
let proxyhostsURL = 'https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts';
let EndPS = '';

let FileName = 'WorkerVless2sub';
let SUBUpdateTime = 6; 
let total = 99;//PB
//let timestamp = now;
let timestamp = 4102329600000;//2099-12-31

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

async function getAddressesapi() {
	if (!addressesapi || addressesapi.length === 0) {
		return [];
	}
	
	let newAddressesapi = [];
	
	for (const apiUrl of addressesapi) {
		try {
			const response = await fetch(apiUrl);
		
			if (!response.ok) {
				console.error('获取地址时出错:', response.status, response.statusText);
				continue;
			}
		
			const text = await response.text();
			const lines = text.split('\n');
			const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(#.*)?$/;
		
			const apiAddresses = lines.map(line => {
				const match = line.match(regex);
				return match ? match[0] : null;
			}).filter(Boolean);
		
			newAddressesapi = newAddressesapi.concat(apiAddresses);
		} catch (error) {
			console.error('获取地址时出错:', error);
			continue;
		}
	}
	
	return newAddressesapi;
}

async function getAddressescsv() {
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
		
			const text = await response.text();
			const lines = text.split('\n');
		
			
			const header = lines[0].split(',');
			const tlsIndex = header.indexOf('TLS');
			const speedIndex = header.length - 1; // 最后一个字段
		
			const ipAddressIndex = 0;
			const portIndex = 1;
			const dataCenterIndex = tlsIndex + 1; 
		
			if (tlsIndex === -1) {
				console.error('CSV文件缺少必需的字段');
				continue;
			}
		
			
			for (let i = 1; i < lines.length; i++) {
				const columns = lines[i].split(',');
		
				
				if (columns[tlsIndex].toUpperCase() === 'TRUE' && parseFloat(columns[speedIndex]) > DLS) {
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

let protocol;
export default {
	async fetch (request, env) {
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID; 
		subconverter = env.SUBAPI || subconverter;
		subconfig = env.SUBCONFIG || subconfig;
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const format = url.searchParams.get('format') ? url.searchParams.get('format').toLowerCase() : "null";
		let host = "";
		let uuid = "";
		let path = "";
		let UD = Math.floor(((timestamp - Date.now())/timestamp * 99 * 1099511627776 * 1024)/2);
		total = total * 1099511627776 * 1024;
		let expire= Math.floor(timestamp / 1000) ;

		if (mytoken !== '' && url.pathname.includes(mytoken)) {
			host = env.HOST || 'usersubdomain';
			uuid = env.UUID || 'uuid';
			path = env.PATH || "/?ed=2408";
			edgetunnel = env.ED || edgetunnel;
			RproxyIP = env.RPROXYIP || RproxyIP;

			const hasSos = url.searchParams.has('sos');
			if (hasSos) {
				const hy2Url = "https://hy2sub.pages.dev";
				try {
					const subconverterResponse = await fetch(hy2Url);
	
					if (!subconverterResponse.ok) {
						throw new Error(`Error fetching lzUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
					}
	
					const base64Text = await subconverterResponse.text();
					link = atob(base64Text); // 进行 Base64 解码
	
				} catch (error) {
					// 错误处理
				}	
			}
		await sendMessage("#获取订阅", request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
		} else {
			host = url.searchParams.get('host');
			uuid = url.searchParams.get('uuid');
			path = url.searchParams.get('path');
			edgetunnel = url.searchParams.get('edgetunnel') || edgetunnel;
			RproxyIP = url.searchParams.get('proxyip') || RproxyIP;
			
			if (!url.pathname.includes("/sub")) {
				const responseText = `
			路径必须包含 "/sub"
			The path must contain "/sub"
			مسیر باید شامل "/sub" باشد
			
			${url.origin}/sub?host=[your host]&uuid=[your uuid]&path=[your path]
			
			
			
			
			
			
				
				https://github.com/cmliu/WorkerVless2sub
				`;
			
				return new Response(responseText, {
				status: 400,
				headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
			
			if (!host || !uuid) {
				const responseText = `
			缺少必填参数：host 和 uuid
			Missing required parameters: host and uuid
			پارامترهای ضروری وارد نشده: هاست و یوآی‌دی
			
			${url.origin}/sub?host=[your host]&uuid=[your uuid]&path=[your path]
			
			
			
			
			
			
				
				https://github.com/cmliu/WorkerVless2sub
				`;
			
				return new Response(responseText, {
				status: 400,
				headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
			
			if (!path || path.trim() === '') {
				path = '/?ed=2408';
			} else {
				
				path = (path[0] === '/') ? path : '/' + path;
			}
		}

		if (userAgent.includes('telegram') || userAgent.includes('twitter') || userAgent.includes('miaoko')) {
			return new Response('Hello World!');
		} else if ((userAgent.includes('clash') || (format === 'clash' && !userAgent.includes('subconverter'))) && !userAgent.includes('nekobox')) {
			const subconverterUrl = `https://${subconverter}/sub?target=clash&url=${encodeURIComponent(request.url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;

			try {
				const subconverterResponse = await fetch(subconverterUrl);
				
				if (!subconverterResponse.ok) {
					throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
				}
				
				const subconverterContent = await subconverterResponse.text();
				
				return new Response(subconverterContent, {
					headers: { 
						"Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}; filename=${FileName}`,
						"content-type": "text/plain; charset=utf-8",
						"Profile-Update-Interval": `${SUBUpdateTime}`,
						"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
					},
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
		} else if (userAgent.includes('sing-box') || userAgent.includes('singbox') || (format === 'singbox' && !userAgent.includes('subconverter'))){
			const subconverterUrl = `https://${subconverter}/sub?target=singbox&url=${encodeURIComponent(request.url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;

			try {
			const subconverterResponse = await fetch(subconverterUrl);
			
				if (!subconverterResponse.ok) {
					throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
				}
				
				const subconverterContent = await subconverterResponse.text();
				
				return new Response(subconverterContent, {
					headers: { 
						"Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}; filename=${FileName}`,
						"content-type": "text/plain; charset=utf-8",
						"Profile-Update-Interval": `${SUBUpdateTime}`,
						"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
					},
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
		} else {
			if(host.includes('workers.dev') || host.includes('pages.dev')) {
				if (proxyhostsURL) {
					try {
						const response = await fetch(proxyhostsURL); 
					
						if (!response.ok) {
							console.error('获取地址时出错:', response.status, response.statusText);
							return; 
						}
					
						const text = await response.text();
						const lines = text.split('\n');
						
						const nonEmptyLines = lines.filter(line => line.trim() !== '');
					
						proxyhosts = proxyhosts.concat(nonEmptyLines);
					} catch (error) {
						console.error('获取地址时出错:', error);
					}
				}
				
				proxyhosts = [...new Set(proxyhosts)];
			}
			
			const newAddressesapi = await getAddressesapi();
			const newAddressescsv = await getAddressescsv();
			addresses = addresses.concat(newAddressesapi);
			addresses = addresses.concat(newAddressescsv);
			
			
			const uniqueAddresses = [...new Set(addresses)];
			
			const responseBody = uniqueAddresses.map(address => {
				let port = "443";
				let addressid = address;
			
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
				
				if (edgetunnel.trim() === 'cmliu' && RproxyIP.trim() === 'true') {
					
					let lowerAddressid = addressid.toLowerCase();
					
					let foundProxyIP = null;
				
					
					for (let item of CMproxyIPs) {
						if (lowerAddressid.includes(item.type.toLowerCase())) {
							foundProxyIP = item.proxyIP;
							break; 
						}
					}
				
					if (foundProxyIP) {
						
						path = `/proxyIP=${foundProxyIP}`;
					} else {
						
						const randomProxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
						path = `/proxyIP=${randomProxyIP}`;
					}
				}
				
				let 伪装域名 = host ;
				let 最终路径 = path ;
				let 节点备注 = EndPS ;
				if(proxyhosts && (host.includes('.workers.dev') || host.includes('pages.dev'))) {
					最终路径 = `/${path}`;
					伪装域名 = `${host}`;
					节点备注 = `${EndPS} RE`;
					sni = 伪装域名;
				}
				const vlessLink = `vless://${uuid}@${address}:${port}?encryption=none&security=tls&sni=${sni}&alpn=http%2F1.1&fp=randomized&type=ws&host=${伪装域名}&path=${encodeURIComponent(最终路径)}#${encodeURIComponent(addressid)}`;
			
				return vlessLink;
			}).join('\n');
			
			const combinedContent = responseBody + '\n' + link; 
			const base64Response = btoa(combinedContent);


			const response = new Response(base64Response, {
				headers: { 
					//"Content-Disposition": `attachment; filename*=utf-8''${encodeURIComponent(FileName)}; filename=${FileName}`,
					"content-type": "text/plain; charset=utf-8",
					"Profile-Update-Interval": `${SUBUpdateTime}`,
					"Subscription-Userinfo": `upload=${UD}; download=${UD}; total=${total}; expire=${expire}`,
				},
			});

			return response;
		}
	}
};
