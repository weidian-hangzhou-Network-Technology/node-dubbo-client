#node-dubbo-client
dubbo node客户端,支持服务注册和服务订阅功能,目前只支持jsonrpc协议.

##Installation
```npm
npm install --save node-dubbo-client
```

##Example
consumer
```javascript
const { Consumer } = require('./index');
Consumer.init({
  description:{
    application: 'test',
    'application.version': '1.0',
    dubbo: 'dubbo_node_client_1.0',
    pid: process.pid,
    version: '1.0.0',
  },    
  registry: {
    url: '192.168.0.110:2181',
  },
});

Consumer
  .getService({ serviceName: 'test.service', group: 'test', version: '1.0.0' })
  .call('testMethod', ['params'])
  .then((result) => console.log(result))
  .catch((err) => console.error(err));
```
provider
```javascript
const { Provider } = require('./index');
Provider.init({
  description: {
    application: 'weidian',
    'application.version': '1.0',
    dubbo: 'dubbo_node_client_1.0',
    pid: process.pid,
    version: '1.0.0',
  },
  registry: {
    url: '192.168.0.110:2181',
  },
  port: 9009,
});

Provider
  .addProvider({
    serviceName: 'node.testService',
    group: 'node',
    version: '0.0.1',
    methods: { 
      test: (...args) => Promise.resolve({ result: 'hello world!' }), 
    },
  })
  .catch((err) => console.error(err));
```

##Document
###Consumer
#####init(options)
初始化配置,连接zookeeper.
**options**
* description `Object` - 当前实例的相关描述信息
    * application `String` - 应用名称
    * application.version `String` - 应用版本
    * category `String` (default: 'consumers') - 应用分类`注:建议使用默认值`
    * side `String` (default: 'consumer') - 应用分类`注:建议使用默认值`
    * dubbo `String` - dubbo说明
    * pid `Number` - 进程id
    * version `String` - 应用版本
* dubbo `Object` - service配置
    * providerTimeout `Number` (default: 45 * 1000) - 调用服务的timeout时间
    * weight `Number` (default: 100) - service默认权值
* registry `Object` - zookeeper配置
    * url `String`
    * options `Object`
        * sessionTimeout `Number` (default: 30 * 1000)
        * spinDelay `Number` (default: 1000)
        * retries `Number` (default: 0)
* loadBalance `String` (default: 'round') - 负载方式(round/random)
* debug `Boolean` (default: false) - 调试模式,控制调试日志的输出

#####setLog(logger)
日志输出,默认是console,传入的logger必须实现info,debug,error三个接口.

#####dispose()
注销zookeeper

#####getService({serviceName,group,version})
获取service信息,并返回两个方法call和check.
* check(methodName) - 用来检测service的某个方法是否存在
* call(methodName,data) - 调用方法,以promise的方式返回
    * methodName `String`
    * data `Array` - 数据需要以数组的方式传入,必须与provider方定义的参数顺序一致

###Provider

#####init(options)
**options**
* description `Object` - 当前实例的相关描述信息
    * application `String` - 应用名称
    * application.version `String` - 应用版本
    * category `String` (default: 'providers') - 应用分类`注:建议使用默认值`
    * side `String` (default: 'provider') - 应用分类`注:建议使用默认值`
    * dubbo `String` - dubbo说明
    * pid `Number` - 进程id
    * version `String` - 应用版本
    * server `String` (default: 'express') - 提供服务的服务器类型
* registry `Object` - zookeeper配置
    * url `String`
    * options `Object`
        * sessionTimeout `Number` (default: 30 * 1000)
        * spinDelay `Number` (default: 1000)
        * retries `Number` (default: 0) 
* port `Number` - 当前服务注册端口,非必须,可以在注册服务的时候进行设置.

#####setLog(logger)
与Consumer一致

#####dispose()
这一步操作会依次进行以下操作:
* 移除zookeeper上注册的服务
* 关闭zookeeper连接
* 关闭web server

#####addProvider(provider)
注册服务到zookeeper,并启动web服务器.
**provider**
* serviceName `String` - 服务名称
* group `String` - 服务所属组
* version `String` - 服务版本
* port `Number` - 默认取init(options)中的端口设置
* methods `Object` - 实现方法,每一个方法需要返回promise,返回内容将直接作为结果返回给调用者.

