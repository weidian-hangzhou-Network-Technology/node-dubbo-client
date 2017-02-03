// /**
//  * 参考https://github.com/Corey600/zoodubbo/blob/master/lib/codec.js
//  */
//
// const hessian = require('hessian.js');
//
// /**
//  * dubbo 传输协议体 body 的最大长度
//  * 协议允许的最大长度为 2^32-1 = 4294967296
//  * 建议的最大长度为 100K = 100 * 1024 * 8 = 819200
//  */
// const MAX_LENGTH = 819200;
//
// /**
//  * 编码传输协议头 <header>
//  * 协议头 定长 16个字节（128位）
//  *  0 - 1B dubbo协议魔数(short) 固定为 0xda 0xbb
//  *  2 - 2B 消息标志位
//  *  3 - 3B 状态位
//  *  4 -11B 设置消息的id long类型
//  * 12 -15B 设置消息体body长度 int类型
//  * -----------------------------------------------------------------------------------------------
//  * | Bit offset |        0-7 |      8-15 |            16-20 |    21 |      22 |      23 |  24-31 |
//  * -----------------------------------------------------------------------------------------------
//  * |          0 | Magic High | Magic Low | Serialization id | event | Two way | Req/res | status |
//  * -----------------------------------------------------------------------------------------------
//  * |      32-95 | id (long)                                                                      |
//  * -----------------------------------------------------------------------------------------------
//  * |     96-127 | data length                                                                    |
//  * -----------------------------------------------------------------------------------------------
//  *
//  */
// function buildHead(length) {
//   if (length > MAX_LENGTH) {
//     throw new Error('Data length too large: ' + length + ', max payload: ' + MAX_LENGTH);
//   }
//
//   let head = [0xda, 0xbb, 0xc2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
//   let i = 15;
//
//   while (256 <= length) {
//     head.splice(i--, 1, length % 256);
//     length = length >> 8;
//   }
//
//   head.splice(i, 1, length);
//
//   return new Buffer(head);
// }
//
// function buildBody() {
//   let encoder = new hessian.EncoderV2();
// }
//
// module.exports = () => {
//
// };
