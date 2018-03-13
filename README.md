# node-dubbo-client
[![Build Status](https://travis-ci.org/MarvinWilliam/node-dubbo-client.svg?branch=master)](https://travis-ci.org/MarvinWilliam/node-dubbo-client)
[![codecov](https://codecov.io/gh/MarvinWilliam/node-dubbo-client/branch/master/graph/badge.svg)](https://codecov.io/gh/MarvinWilliam/node-dubbo-client)

[![NPM](https://nodei.co/npm/node-dubbo-client.png)](https://nodei.co/npm/node-dubbo-client/)

## Installation
```npm
npm install --save node-dubbo-client
```

## Example
consumer
```javascript
const dubbo = require('node-dubbo-client');

dubbo.config({});

dubbo
  .consumer
  .getService({ service: 'test.service', group: 'test', version: '1.0.0' })
  .call('testMethod', ['params'])
  .then((result) => console.log(result))
  .catch((err) => console.error(err));
```
provider
```javascript
const dubbo = require('node-dubbo-client');

dubbo.config({});

dubbo
  .provider
  .init({ service: 'node.testService', group: 'node', version: '1.0.0' })
  .addMethods({ 
    test: (...args) => Promise.resolve({ result: 'hello world!' }), 
  })
  .listen(3000);
```

## Document
### dubbo.init(options:object):Promise\<void\>
初始化zookeeper连接.

订阅者模式下, service调用会一直阻塞到zookeeper连接创建.

发布者模式下, 本地http server启动后再连接到zookeeper, 并发布服务.

如果两个模式共用, 以发布者模式为准.

**options**
* description `object` - 应用描述
    * application `string` - 当前应用名称
    * application.version `string` - 当前应用的版本 
    * dubbo `string` - dubbo版本
    * pid `number` - 进程Id
* dubbo `object` - service配置
    * timeout `number` (default: 45 * 1000) - 服务提供者调用超时时间
    * enableRetry `boolean` (default: true) - 自动重试,服务提供者返回ECONNREFUSED,下线该提供者并重试
* registry `object`
    * url `string` (required)
    * options `object` - [node-zookeeper-client options](https://github.com/alexguan/node-zookeeper-client#client-createclientconnectionstring-options)
        * sessionTimeout `number` (default: 30 * 1000)
        * spinDelay `number` (default: 1000)
        * retries `number` (default: 0)
* loadBalance `string` (default: 'round') - 订阅者调用的负载方式(round/random)
* debug `boolean` (default: false) - 是否输出zookeeper推送的消息.

### dubbo.dispose():Promise\<void\>
订阅者模式下, 只关闭zookeeper连接.

发布者模式下,会依次进行以下操作:
1. 从zookeeper上移除当前服务节点;
2. 关闭zookeeper连接;
3. 关闭http服务器.

### dubbo.onLog(calbak:function(msg:string)):void
日志输出, 如果给予回调函数, 默认使用[debug](https://github.com/visionmedia/debug) 输出日志.

* options.debug=true, it will print zookeeper listener result.

### dubbo.consumer
**getService(serviceInfo:object):serviceObject**
* serviceInfo `object`
    * service `string` (required) 服务的namespace
    * group `string` (required)
    * version `string` (required)

**serviceObject.call(methodName:string, data:Array<\*>)**

```java
// 后端提供者
public String testMethod(int a, int b, int c);
```

```javascript
// consumer 方法调用
const service = dubbo.consumer.getService({});
service
  .call('testMethod',[1, 2, 3])
  .then((str) => {})
  .catch(() => {});
```

### dubbo.provider
**init(serviceInfo:object):Provider**

provider基本信息声明.

**Provider.addMethods(functions:object):Provider**

批量添加provider方法

```javascript
provider.addMethods({
  method1: (a, b, c) => {
    return 'something';
  },
});
```

**Provider.addMethod(name:string, handler:function(...params:\*):\*):Provider**

添加单个provider方法

**Provider.listen(port:number):Promise<void>**

启动provider的http服务器.该方法应该在provider配置完成之后调用

**Provider.configServer(serverOpts:object):Provider**
* serverOpts `object`
    * limit `string` [raw-body](https://github.com/stream-utils/raw-body) options.limit

配置http服务, 目前只提供raw-body的配置项. 
