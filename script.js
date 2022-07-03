const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')

const ROW = 20
const RADIUS = ROW/2
const RIGHT_MAX = canvas.width
const BOTTOM = canvas.height

const PLAYER_WIDTH = 20

const game = {
    player: null
}

class Segment {
    constructor(position) {
        this.position = position
    }

    draw = (context) => {
        context.beginPath()
        context.arc(this.position.x, this.position.y, 0, 2*Math.PI)
        ctx.fill()
    }
}

class Snake {
    static snakes = []

    constructor(headPosition,segments,direction,color="rgba(0,200,0,0.5)"){
        this.headPosition = headPosition
        this.segments = segments
        this.direction = direction
        this.yDirection = 1
        this.yToggleCue = false
        this.color=color
        Snake.snakes.push(this)
        this.interval = this.moveSnake(Math.floor(Math.random()*8)+1)
    }
    
    getSnake() {
        if (this.segments < 1) {
            Snake.snakes.splice(Snake.snakes.indexOf(this),1)
            clearInterval(this.interval)
        }
        const curPos = {...this.headPosition}
        let direction = this.direction
        const nodes = []
        new Array(this.segments).fill(null).forEach((x,i)=>{

            // check player collision
            if (game.player && Math.abs(game.player.position.x + (PLAYER_WIDTH/2) - curPos.x) < RADIUS
            && Math.abs(game.player.position.y + (PLAYER_WIDTH/2) - curPos.y) < RADIUS) {
                game.player.damage(5)
            }

            // check dart collisions
            if (Dart.darts.find(dart => {
                if (Math.abs(dart.position.x - curPos.x) < RADIUS * 2/3
                    && Math.abs(dart.position.y - curPos.y) < RADIUS * 2/3) {
                        dart.remove()
                        return true
                    }
            })) {
                this.segments -= 1
            }


            // check block collisions
            const blockingBlock = Block.blocks.find(block => {
                return Math.abs(block.position.x + ROW/2 - curPos.x) < RADIUS * 2
                    && Math.abs(block.position.y - curPos.y) < RADIUS * 2
                })
            if (blockingBlock) {
                // nodes.push({...curPos})
                // curPos.x = RADIUS + curPos.x
                // curPos.y += 2*RADIUS*this.yDirection
                // direction *= -1
                // if (direction > 0) {
                    curPos.x = blockingBlock.position.x+((RADIUS+PLAYER_WIDTH)*direction)
                    curPos.y -= 2*RADIUS*this.yDirection
                    direction *= -1
                    // nodes.push({...curPos})
                // } else {
                //     curPos.x = blockingBlock.position.x-((RADIUS+PLAYER_WIDTH)*direction)
                //     curPos.y -= 2*RADIUS*this.yDirection
                //     direction = 1
                // }
            } else

            if (direction > 0) {
                if (curPos.x - RADIUS >= 0) {
                    nodes.push({...curPos})
                    curPos.x -= 2*RADIUS
                } else {
                    curPos.x = RADIUS + curPos.x
                    curPos.y -= 2*RADIUS*this.yDirection
                    direction = -1
                    nodes.push({...curPos})
                }
            } else {
                if (curPos.x + RADIUS <= RIGHT_MAX) {
                    nodes.push({...curPos})
                    curPos.x += 2*RADIUS
                } else {
                    curPos.x = RIGHT_MAX-RADIUS-(RIGHT_MAX-curPos.x)
                    curPos.y -= 2*RADIUS*this.yDirection
                    direction = 1
                    nodes.push({...curPos})
                }
            }
        })
        return nodes
    }

    drawSnake(context) {
        ctx.fillStyle = this.color
        this.getSnake().forEach(seg => {
            context.beginPath()
            context.arc(seg.x, seg.y, RADIUS, 0, 2*Math.PI)
            context.fill()
        })
    }

    moveSnake(velocity=3){
        const inter = setInterval(()=>{
            if (!this.yToggleCue && (this.headPosition.y > BOTTOM - 2*RADIUS || this.headPosition.y < 0 + RADIUS)) {
                this.yToggleCue = true
            }

            // check block collisions
            const blockingBlock = Block.blocks.find(block => {
                return Math.abs(block.position.x - this.headPosition.x) < RADIUS * 2
                    && Math.abs(block.position.y - this.headPosition.y) < RADIUS * 2
                })
            if (blockingBlock) {
                    // curPos.x = RADIUS + curPos.x
                    // curPos.y += 2*RADIUS*this.yDirection
                    this.headPosition.x = blockingBlock.position.x+ROW
                    this.headPosition.y += 2*RADIUS*this.yDirection
                    this.direction *= -1
            } else if (this.direction > 0) {
                if (this.headPosition.x + RADIUS + velocity <= RIGHT_MAX) {
                    this.headPosition.x += velocity
                } else {
                    if (this.yToggleCue) {
                        this.yDirection *= -1
                        this.yToggleCue = false
                    }
                    this.headPosition.x = RIGHT_MAX - RADIUS
                    this.headPosition.y += 2*RADIUS*this.yDirection
                    this.direction = -1
                }
            } else {
                if (this.headPosition.x - RADIUS - velocity > 0) {
                    this.headPosition.x -= velocity
                } else {
                    if (this.yToggleCue) {
                        this.yDirection *= -1
                        this.yToggleCue = false
                    }
                    this.headPosition.x = RADIUS
                    this.headPosition.y += 2*RADIUS*this.yDirection
                    this.direction = 1
                }
            }
        }, 10)
        return inter
    }
}

class Player {
    constructor() {
        this.health = 100
        this.position = {
            x: RIGHT_MAX/2 - 20,
            y: BOTTOM - 20
        }
        this.velocity = {
            x: 0,
            y: 0
        }
        this.block = false
    }

    draw(){
        ctx.fillStyle = `rgba(200,29,17,${this.health/100})`
        ctx.fillRect(this.position.x, this.position.y, PLAYER_WIDTH, PLAYER_WIDTH)
    }

    move(xVector,yVector){
        if (xVector) {
            this.velocity.x += xVector
        }
        if (yVector) {
            this.velocity.y += yVector
        }
    }

    damage(amount=1) {
        this.health -= amount
        if (this.health <= 0) {
            cancelAnimationFrame(currentAnim)
        }
    }

    exist(){
        const exister = setInterval(()=>{
            this.position.x += this.velocity.x
            if (this.position.x > RIGHT_MAX - PLAYER_WIDTH || this.position.x < 0) {
                this.position.x = this.position.x > 0 ? RIGHT_MAX - PLAYER_WIDTH : 0
                this.velocity.x = Math.ceil(this.velocity.x * -0.5)
            }
            this.position.y += this.velocity.y
            if (this.position.y >= BOTTOM-20) {
                this.position.y = BOTTOM-20
                this.velocity.y = 0
            } else {
                const blockingBlock = Block.blocks.find(block => {
                    return Math.abs(block.position.x - this.position.x) < ROW
                    && Math.abs(block.position.y - this.position.y) < ROW
                })
                if (blockingBlock) {
                    this.velocity.y = 0
                    this.block = blockingBlock.position.y > this.position.y
                } else {
                    this.block = false
                }
            }
        },1)

        const drag = setInterval(() => {
            if (this.velocity.x) {
                this.velocity.x > 0 ?
                this.velocity.x -= 1 : this.velocity.x += 1
            }
        },60)

        const gravity = setInterval(() => {
            this.position.y <= BOTTOM - 20 && !this.block ?
                this.velocity.y +=1 :
                this.velocity.y = 0
        },80)
    }
}

class Dart {
    static darts = []
    constructor(position, color="orange") {
        this.position = {...position}
        this.color = color
        Dart.darts.push(this)
        this.interval = this.fire()
    }

    fire(){
        const darter = setInterval(()=> {
            if (this.position.y < 0) {
                this.remove()
            } else {
                const hitBlock = Block.blocks.find(block => {
                    return Math.abs(block.position.x + ROW/2 - this.position.x) < ROW / 2
                    && Math.abs(block.position.y + ROW/2 - this.position.y) < ROW
                })
                if (hitBlock) {
                    hitBlock.damage(2)
                    this.remove()
                }
            }
            this.position.y -= 4
        },5)
        return darter
    }

    remove(){
        Dart.darts.splice(Dart.darts.indexOf(this),1)
        clearInterval(this.interval)
    }

    draw(){
        ctx.fillStyle = this.color
        ctx.fillRect(this.position.x, this.position.y, Math.floor(PLAYER_WIDTH/4), 20)
    }
}

class Block {
    static blocks = []

    constructor(position) {
        this.position = {...position}
        this.health = 10
        Block.blocks.push(this)
    }

    damage(amount=1) {
        this.health -= amount
        if (this.health <= 0) {
            this.remove()
        }
    }

    remove(){
        Block.blocks.splice(Block.blocks.indexOf(this),1)
    }

    draw(){
        ctx.fillStyle = `rgba(0,0,0,${this.health/10})`
        ctx.fillRect(this.position.x, this.position.y, ROW, ROW)
    }
}

new Snake({x:0, y:RADIUS}, Math.floor(Math.random()*12) + 8, 1), 
new Snake({x:RIGHT_MAX, y:3*RADIUS}, Math.floor(Math.random()*12) + 8, -1, "lightblue"),
new Snake({x:0, y:3*RADIUS}, Math.floor(Math.random()*12) + 8, -1, "orange"),
// new Snake({x:200, y:RADIUS}, Math.floor(Math.random()*12) + 8, -1, "grey")

new Block({x:10*ROW,y:6*ROW})
new Block({x:15*ROW,y:8*ROW})
new Block({x:20*ROW,y:10*ROW})
new Block({x:8*ROW,y:13*ROW})
new Block({x:24*ROW,y:18*ROW})
new Block({x:27*ROW,y:28*ROW})
new Block({x:26*ROW,y:28*ROW})
new Block({x:25*ROW,y:28*ROW})
new Block({x:24*ROW,y:28*ROW})
new Block({x:23*ROW,y:28*ROW})
new Block({x:22*ROW,y:28*ROW})
new Block({x:21*ROW,y:28*ROW})
new Block({x:20*ROW,y:28*ROW})

game.player = new Player()

let currentAnim
const bounce = () => {
    currentAnim = requestAnimationFrame(bounce)
    ctx.clearRect(0,0,canvas.width,canvas.height)
    Snake.snakes.forEach(snek => snek.drawSnake(ctx))
    Block.blocks.forEach(block => block.draw())
    Dart.darts.forEach(dart => dart.draw())
    game.player.draw()
}

if (ctx) {
    bounce()
    game.player.exist()
    addEventListener('keydown',(e)=>{
        switch (e.key) {
            case "w":
                game.player.move(0,-4)
                break
            case "s":
                game.player.move(0,4)
                break
            case "a":
                game.player.move(-4,0)
                break
            case "d":
                game.player.move(4,0)
                break
            case " ":
                new Dart({x: game.player.position.x + PLAYER_WIDTH/8*3, y: game.player.position.y})
        }
    })
} else {
  // canvas-unsupported code here
}

// const drawShapes = (ctx) => {
    
//     ctx.fillStyle = 'rgb(200, 0, 0)';
//     ctx.fillRect(10, 10, 50, 50);

//     ctx.strokeStyle = 'rgba(0, 0, 200, 0.5)';
//     ctx.strokeRect(30, 30, 50, 50);

//     ctx.beginPath()
//     ctx.moveTo(15,15)
//     ctx.lineTo(96,19)
//     ctx.quadraticCurveTo(104,52,74,48)
//     ctx.closePath()
//     ctx.fillStyle = 'rgba(0,200,0,0.5)'
//     ctx.fill()
// }

// const drawLink = async (ctx) => {
//     const link = new Image(40,40)
//     link.src = 'link.png'
//     link.onload = async () => {
//         const bitmap = await createImageBitmap(link, 0, 0, 100, 100)
//         ctx.drawImage(bitmap, 50, 50)
//     }
// }

