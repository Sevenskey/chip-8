/***** Class *****/
/*
 * Opcode
 * ProgramCounter
 * VRegister
 * Memory
 * Timer
 */
class Opcode {
  constructor (opcode) {
    this.v = opcode
  }
  // index: from 0 to 3
  // @param index: number
  // @return number
  getSpecificedDigit (index) {
    if (index > 3 || index < 0) {
      throw new Error('Required index of specificed digit must from 0 to 3.')
    }
    const base = 0x000F
    const num = 4 * index
    const needed = base << num
    return (this.v & needed) >>> num
  }

  // index: from 1 to 3
  // @param index: number
  // @return number
  getFristNDigits (index) {
    const base = 4 * 4
    const num = base - index * 4
    return (this.v << num) >>> num
  }
}

class ProgramCounter {
  constructor () {
    this.v = 0
    this.init()
  }

  init () {
    this.v = 0x200
    return this.v
  }

  nextOpcode () {
    this.next()
    this.next()
    return this.v
  }

  next () {
    this.v += 1
    return this.v
  }

  skipAnOpcode () {
    this.nextOpcode()
    this.nextOpcode()
    return this.v
  }

  recover () {
    this.v = STACK.pop()
    return this.v
  }

  store () {
    STACK.push(this.v)
  }

  assign (v) {
    this.v = v
  }
}

class VRegister {
  constructor () {
    this.v = 0
    this.max = 0xFF
  }

  typeCheck (obj) {
    if (obj instanceof VRegister) {
      return obj.v
    } else if (typeof obj === 'number') {
      return obj
    } else {
      throw new Error('Can\'t resolve this type')
    }
  }

  // @addend VRegister or number
  // @return boolean
  add (obj) {
    let num = this.typeCheck(obj)
    this.v += num
    if (this.v > this.max) {
      this.v &= this.max
      return true
    }
    return false
  }

  // @obj VRegister or number
  // @return boolean
  sub (obj) {
    let num = this.typeCheck(obj)
    this.v -= num
    this.v &= this.max
    if (num > this.v) {
      return true
    }
    return false
  }

  resub (obj) {
    let num = this.typeCheck(obj)
    this.v = num - this.v
    this.v &= this.max
    if (num < this.v) {
      return true
    }
    return false
  }

  // @obj VRegister or number
  // @return void
  assign (obj) {
    let num = this.typeCheck(obj)
    this.v = num
  }

  eq (obj) {
    let num = this.typeCheck(obj)
    return this.v === num
  }

  // @obj VRegister or number
  // @return void
  bitOp (op, obj) {
    let num = this.typeCheck(obj)
    switch (op) {
      case '|':
        this.v |= num
        break
      case '&':
        this.v &= num
        break
      case '^':
        this.v ^= num
        break
      case '>>':
        this.v >> num
      case '<<':
        this.v << num
      default:
        throw new Error('Can\'t resolve this bit operator.')
    }
  }

  getLSBit () {
    return this.v & 0x1
  }

  getMSBit () {
    return this.v & 0x80
  }
}

class Memory {
  constructor () {
    this.max = 4096
    this.v = new Array(this.max)
  }

  // 一维数组和数字
  write (addr, content) {
    if (typeof content === 'string') {
      if (content > 0xFF) {
        throw new Error('The length of wrote content is too long.')
      } 
      this.v[addr] = content
    } else if (Array.isArray(content)) {
      content.forEach((e, i) => {
        this.write(addr + i, e)
      })
    }
  }

  dump (addr, num) {
    if (num) {
      return this.v.slice(addr, addr + num)
    }
    return this.v[addr]
  }
}

class Timer {
  constructor () {
    this.max = 0xFF
    this.v = this.max
  }

  assign (v) {
    if (v > this.max) {
      throw new Error('The assigned number is so large.')
    }
    this.v = v
  }
  
  down () {
    this.v--
  }

  notZero () {
    return this.v > 0
  }
}

class GFX {
  /*
 * 显存
 * 64 * 32 (2048px)
 * 0 black
 * 1 white
 */
  constructor () {
    this.d = new Array(2048)
  }

  draw (Vx, Vy, N) {
  }
}

class Key {
  constructor () {
    this.all = new Array(16)
    this.all.forEach((e, i) => {
      this.all[i] = i
    })
    this.curKey = null
  }

  press (keyNum) {
    this.curKey = this.all[keyNum]
  }
}

/***** Defination *****/

// 一个地址对应一个字节
const MEM = new Memory()
const V = new Array(16)
V.forEach((e, i) => {
  V[i] = new VRegister()
})

// 16-bit
let I = 0
let PC = new ProgramCounter()

/*
 * Memory map
 * 0x000 - 0x1FF 解释器（包含用于显示的字体）
 * 0x050 - 0x0A0 用于生成4*5像素的字体集合（0 - F）
 * 0x200 - 0xFFF 游戏ROM与工作ROM
 */ 
const Display = new GFX()

let D_Timer = new Timer()
let S_Timer = new Timer()

/*
 * 调用子函数之前将PC当前值推入栈
 * 16层
 */

const STACK = new Array(16)
const SP = 0

// 键盘状态
const KEY = new Key()

function cycle() {

  const T = 10
  setCycle()
  // get opcode
  // decode opcode
  // execute opcode
  // update counter
}

function setCycle (f, T) {
  return setTimeout (() => {
    f(setCycle(f, T))
  }, T)
}

function updateTimers() {
  if (D_Timer.notZero()) {
    D_Timer.down()
  }
  if (S_Timer.notZero()) {
    if (S_Timer.v === 1) {
      console.log('BEEP!')
    }
    S_Timer.down()
  }
}

function readOpcodeFromMem () {
  let opcode = MEM[PC] << 8 | MEM[PC + 1]
  return new Opcode(opcode)
}


function executeOpcode (opcode) {
  let o = new Opcode(opcode)
  let three = o.getSpecificedDigit(3),
    zero = o.getSpecificedDigit(0),
    one = o.getSpecificedDigit(1),
    two = o.getSpecificedDigit(2)

  let x = two, y = one, n = zero
  let nn = o.getFristNDigits(2)
  let nnn = o.getFristNDigits(3)

  PC.nextOpcode()

  switch (three) {
    case 0:
      if (o.v == 0x00E0) {
        // clears the screen
      } else if (o.v == 0x00EE) {
        PC.recover()
      } else {
        PC.store()
        PC.assign(nnn)
      }
      break
    case 1:
      PC.assign(nnn)
      break
    case 2:
      PC.store()
      PC.assign(nnn)
      break
    case 3:
      if (V[x].eq(nn)) {
        PC.nextOpcode()
      }
      break
    case 4:
      if (! V[x].eq(nn)) {
        PC.nextOpcode()
      }
      break
    case 5:
      if (V[x].eq(V[y])) {
        PC.nextOpcode()
      }
      break
    case 6:
      V[x].assign(nn)
      break
    case 7:
      V[x].add(nn)
      break
    case 8:
      switch(zero) {
        case 0:
          V[x].assign(V[y])
          break
        case 1:
          V[x].bitOp('|', V[y])
          break
        case 2:
          V[x].bitOp('&', V[y])
          break
        case 3:
          V[x].bitOp('^', V[y])
          break
        case 4:
          let carry = V[x].add(V[y])
          if (carry) {
            V[0xF].assign(1)
          } else {
            V[0xF].assign(0)
          }
          break
        case 5:
          let borrow = V[x].sub(V[y])
          if (borrow) {
            V[0xF].assign(0)
          } else {
            V[0xF].assign(1)
          }
          break
        case 6:
          V[0xF].assign(V[y].getLSBit())
          V[y].bitOp('>>', 1)
          V[x].assign(V[y])
          break
        case 7:
          let borrow = V[x].resub(V[y])
          if (borrow) {
            V[0xF].assign(0)
          } else {
            V[0xF].assign(1)
          }
          break
        case 0xE:
          V[0xF].assing(V[y].getMSBit())
          V[y].bitOp('<<', 1)
          V[x].assing(V[y])
          break
        default:
          throw new Error('Unknow opcode: ' + o.v)
      }
      break
    case 9:
      if (!V[x].eq(V[y])) {
        PC.nextOpcode()
      }
      break
    case 0xA:
      I = nnn
      break
    case 0xB:
      PC.assign(nnn + V[0].v)
      break
    case 0xC:
      V[x].assign(rand() & nn)
      break
    case 0xD:
      // Draws a sprite at corrdinate (VX, VY) that has a width of 8 pixels and a height of N pixels. each row of 8 pixels is read as bit-coded starting fromm memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen
      break
    case 0xE:
      if (nn === 0x9E) {
        if (KEY.curKey === V[x].v) {
          PC.nextOpcode()
        }
      } else if (nn === 0xA1) {
        if (KEY.curKey !== V[x].v) {
          PC.nextOpcode()
        }
      }
      break
    case 0xF:
      const firstTwo = o.getFristNDigits(2)
      switch (firstTwo) {
        case 0x07:
          V[x].assign(D_Timer.v)
          break
        case 0x0A:
          // a key press is awaited, and then stored in VX (blocking operation. all instruction halted until next key event)

          // Waiting...
          V[x].assign(KEY.curKey)
          break
        case 0x15:
          D_Timer.assign(V[x].v)
          break
        case 0x18:
          S_Timer.assign(V[x].v)
          break
        case 0x1E:
          I += V[x].v
          break
        case 0x29:
          // sets I to the location of the sprite for the character in VX. characters 0-F (in hexadecimal) are represented by a 4*5 font
          I = spriteAddr[V[x].v]
          break
        case 0x33:
          let bcd = getBCD(V[x].v)
          MEM.write(I, bcd)
          break
        case 0x55:
          let v = new Array(x + 1)
          v.forEach((e, i) => {
            v[i] = V[i].v
          })
          MEM.write(I, v)
          break
        case 0x65:
          let v = MEM.dump(I, x + 1)
          v.forEach((e, i) => {
            V[i].assign(e)
          })
          break
        default:
          throw new Error('Unknow opcode: ' + o.v)
      }
    default: 
      throw new Error('Unknow opcode: ' + o.v)
  }
}

/***** Function *****/
/*
 * rand
 * getBCD
 */
function rand() {
  const max = 255
  return parseInt(Math.random() * max)
}

function getBCD (num) {
  if (num > 999) {
     throw new Error('Supported digits of number lower than 3.')
  }
  let high = Math.floor(num / 100)
  let mid = Math.floor(num / 10) % 10
  let low = num % 10

  return [high, mid, low]
}
