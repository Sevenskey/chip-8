/***** Class *****/
class Opcode {
  constructor (opcode) {
    this.v = opcode
  }
  // index: from 0 to 3
  // @param index: number
  // @return number
  function getSpecificedDigit (index) {
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
  function getFristNDigits (index) {
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

  function nextOpcode () {
    this.next()
    this.next()
    return this.v
  }

  function next () {
    this.v += 1
    return this.v
  }

  function skipAnOpcode () {
    this.nextOpcode()
    this.nextOpcode()
    return this.v
  }

  function recover () {
    this.v = STACK.pop()
    return this.v
  }

  function store () {
    STACK.push(this.v)
  }

  function assign (v) {
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

/***** Defination *****/

// 一个地址对应一个字节
const MEM = new Memory()
const V = new Array(16)
V.forEach((e, i) => {
  V[i] = new VRegister()
})
let I = 0
let PC = new ProgramCounter()

/*
 * Memory map
 * 0x000 - 0x1FF 解释器（包含用于显示的字体）
 * 0x050 - 0x0A0 用于生成4*5像素的字体集合（0 - F）
 * 0x200 - 0xFFF 游戏ROM与工作ROM
 */ 
  /*
 * 显存
 * 64 * 32 (2048px)
 * 0 black
 * 1 white
 */
const GFX = new Array(2048)

let D_Timer = 0
let S_Timer = 0

/*
 * 调用子函数之前将PC当前值推入栈
 * 16层
 */

const STACK = new Array(16)
const SP = 0

// 键盘状态
const KEY = new Array(16)

function cycle() {
  // get opcode
  // decode opcode
  // execute opcode
  // update counter
}

function updateTimers(): Opcode
function updateTimers() {
  if (D_Timer > 0) {
    D_Timer--
  }
  if (S_Timer > 0) {
    if (S_Timer === 1) {
      console.log('BEEP!')
    }
    S_Timer--
  }
}

function readOpcodeFromMem () {
  let opcode = MEM[PC] << 8 | MEM[PC + 1]
  return { v: opcode } as Opcode
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
    case: 0:
      if (o.v == 0x00E0) {
        // clears the screen
      } else if (o.v == 0x00EE) {
        // returns from a subroutine
        PC.recover()
      } else {
        // call RCA 1802 program at address NNN. not necessary for most ROMs
        PC.store()
        PC.assign(nnn)
      }
      break
    case: 1:
      // jumps to address NNN
      PC.assign(nnn)
      break
    case: 2:
      // calls subroutine at NNN
      PC.store()
      PC.assign(nnn)
      break
    case: 3:
      // skips the next instruction if VX equals NN
      if (V[x].eq(nn)) {
        PC.nextOpcode()
      }
      break
    case: 4:
      // skips the next instruction if VX doesn't equal NN
      if (! V[x].eq(nn)) {
        PC.nextOpcode()
      }
      break
    case: 5:
      // skips the next instruction if VX equals VY
      if (V[x].eq(V[y])) {
        PC.nextOpcode()
      }
      break
    case: 6:
      // sets VX to NN
      V[x].assign(nn)
      break
    case: 7:
      // adds NN to VX (carry flag is not changed)
      V[x].add(nn)
      break
    case: 8:
      switch(zero) {
        case 0:
          // sets VX to the value of VY
          V[x].assign(V[y])
          break
        case 1:
          // sets VX to VX or VY (bitwise OR operation)
          V[x].bitOp('|', V[y])
          break
        case 2:
          // sets VX to VX and VY
          V[x].bitOp('&', V[y])
          break
        case 3:
          // sets VX to VX xor VY
          V[x].bitOp('^', V[y])
          break
        case 4:
          // adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't 
          let carry = V[x].add(V[y])
          if (carry) {
            V[0xF].assign(1)
          } else {
            V[0xF].assign(0)
          }
          break
        case 5:
          // VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't
          let borrow = V[x].sub(V[y])
          if (borrow) {
            V[0xF].assign(0)
          } else {
            V[0xF].assign(1)
          }
          break
        case 6:
          // shifts VY right by one and copies the result to VX. VF is set to the value of the least significant bit of VY before the shift
          V[0xF].assign(V[y].getLSBit())
          V[y].bitOp('>>', 1)
          V[x].assign(V[y])
          break
        case 7:
          // set VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
          let borrow = V[x].resub(V[y])
          if (borrow) {
            V[0xF].assign(0)
          } else {
            V[0xF].assign(1)
          }
          break
        case 0xE:
          // shifts VY left by one and copies the result to VX. VF is set to the value of the most significant bit of VY before the shift
          V[0xF].assing(V[y].getMSBit())
          V[y].bitOp('<<', 1)
          V[x].assing(V[y])
          break
      }
      break
    case: 9:
      // skips the next instruction if VX doesn't equal VY (usually the next instruction is a jump to skip a code block)
      if (!V[x].eq(V[y])) {
        PC.nextOpcode()
      }
      break
    case 0xA:
      // sets I to the address NNN
      I = nnn
      break
    case 0xB:
      // jumps to the address NNN plus V0
      PC.assign(nnn + V[0].v)
      break
    case 0xC:
      // sets VX to the result of a bitwise and operation on a random number (typically 0 to 255) and NN
      V[x].assign(rand() & nn)
      break
    case 0xD:
      // Draws a sprite at corrdinate (VX, VY) that has a width of 8 pixels and a height of N pixels. each row of 8 pixels is read as bit-coded starting fromm memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen
      break
    case 0xE:
      if (nn === 0x9E) {
        // skips the next instruction if the key stored in VX is pressed (usually the next instruction is a jump to skip a code block)
      } else if (nn === 0xA1) {
        // skips the next instruction if the key stored in VX isn't pressed (usually the next instruction is a jump to skip a code block)
      }
      break
    case 0xF:
      const firstTwo = o.getFristNDigits(2)
      switch (firstTwo) {
        case 0x07:
          // sets VX to the value of the delay timer
          V[x].assign(D_Timer)
          break
        case 0x0A:
          // a key press is awaited, and then stored in VX (blocking operation. all instruction halted until next key event)
          break
        case 0x15:
          // sets the delay timer to VX
          D_Timer = V[x].v
          break
        case 0x18:
          // sets the sound timer to VX
          S_Timer = V[x].v
          break
        case 0x1E:
          // adds VX to I
          I += V[x].v
          break
        case 0x29:
          // sets I to the location of the sprite for the character in VX. characters 0-F (in hexadecimal) are represented by a 4*5 font
          I = spriteAddr[V[x].v]
          break
        case 0x33:
          // stores the binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2. (in other wors, take the decimal representation of VX, place the hundreds digit in memory at location in I, the tens digit at location I + 1, and the ones digit at location I + 2)
          break
        case 0x55:
          // stores V0 to VX (including VX) in memory starting at address I. I is increased by 1 for each value written
          break
        case 0x65:
          // fills V0 to VX (including VX) with values from memory starting at address I. I is increasedby 1 for each value written
      }
    default: 
      throw new Error('Unknow opcode: ' + o.v)
  }
}

/***** Function *****/
function rand() {
  const max = 255
  return parseInt(Math.random() * max)
}
