const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d')

const info = document.getElementById('info')
const score = document.getElementById('score')
const health = document.getElementById('health')
const levelIndicator = document.getElementById('level')

// constants
const ROW = 20
const RADIUS = ROW/2
const RIGHT_MAX = canvas.width
const MAX_BLOCK_WIDTH = Math.floor(RIGHT_MAX / ROW) + 1
const BOTTOM = canvas.height
const PLAYER_WIDTH = 20
const DEFAULT_SNAKE_VELOCITY = 3
const DART_DELAY = 80

// game state
const game = {
    player: null,
    score: 0,
    level: 1
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

    // Snake.snakes collects all Snakes in memory
    static snakes = []

    constructor(headPosition,segments,direction,color="rgba(0,200,0,0.5)",velocity=DEFAULT_SNAKE_VELOCITY){
        this.headPosition = headPosition
        this.segments = segments
        this.direction = direction
        this.yDirection = 1
        this.yToggleCue = false
        this.color=color
        Snake.snakes.push(this)
        this.interval = this.moveSnake(velocity)
    }
    
    getSnake() {
        if (this.segments < 1) {
            this.remove()
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
                game.score += 50
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
            } else if (direction > 0) {

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

    moveSnake(velocity=DEFAULT_SNAKE_VELOCITY){
        const inter = setInterval(()=>{
            if (!this.yToggleCue && (this.headPosition.y > BOTTOM - 2*RADIUS || this.headPosition.y < 0 + RADIUS)) {
                this.yToggleCue = true
            }

            // check for block collisions
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

    remove() {
        Snake.snakes.splice(Snake.snakes.indexOf(this),1)
        clearInterval(this.interval)
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
        this.jumped = 0
    }

    draw(){
        ctx.fillStyle = `rgba(200,29,17,${this.health/100})`
        ctx.fillRect(this.position.x, this.position.y, PLAYER_WIDTH, PLAYER_WIDTH)
    }

    move(xVector,yVector, jump=false){
        if (xVector) {
            this.velocity.x += xVector
        }
        if (jump) {
            this.jumped = new Date().getTime()
            if (yVector) {
                this.velocity.y += yVector
            }
        }
    }

    damage(amount=1) {
        this.health -= amount
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
            } else if (this.position.y <= 2) {
                this.velocity.y = 2
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
            if (new Date().getTime() - this.jumped > 100) {
                this.position.y <= BOTTOM - 20 && !this.block ?
                    this.velocity.y +=.5 :
                    this.velocity.y = 0
            }
        },80)
    }
}

class Dart {

    // Dart.darts collects all Darts in memory
    static darts = []

    // timestamp for dart delay
    static lastFired = 0

    constructor(position, color="orange") {
        this.position = {...position}
        this.color = color
        Dart.darts.push(this)
        Dart.lastFired = new Date().getTime()
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

    // Block.blocks collects all Blocks in memory
    static blocks = []

    constructor(position) {
        this.position = {...position}
        this.health = 10
        Block.blocks.push(this)
    }

    damage(amount=1) {
        game.score += 5
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

const snakeColors = ["lightblue", "orange", "green", "darkyellow", "coral", "purple", "magenta"]

const initialize = (levelInfo = {numSnakes: null, numBlocks: 6, velocityMod: null}) => {

    const numSnakes = levelInfo.numSnakes || game.level + 2
    const velocityMod = levelInfo.velocityMod || game.level

    for (let i=0; i < numSnakes; i++) {

        // randomly generate Snake properties (with modifiers)
        const yNum = Math.floor(Math.random() * 5) * 3 * RADIUS || RADIUS
        const xNum = Math.floor(Math.random() * 10) > 5 ? 0 : RIGHT_MAX
        const direction = Math.floor(Math.random() * 10) > 5 ? -1 : 1
        const color = snakeColors[Math.floor(Math.random()*snakeColors.length)]
        const velocity = Math.floor(Math.random()*4*velocityMod) + velocityMod
        
        new Snake({x: xNum, y: yNum}, Math.floor(Math.random()*12) + 8, direction, color, velocity)
    }
    
    for  (let i=0; i < levelInfo.numBlocks; i++) {
        let xNum = Math.floor(Math.random() * MAX_BLOCK_WIDTH)
        const yNum = Math.floor(Math.random() * 24) + 6

        // make random block rows
        let makeRow = true
        while (makeRow && xNum < MAX_BLOCK_WIDTH) {
            new Block({x:xNum*ROW,y:yNum*ROW})
            makeRow = Math.random() > .15
            xNum++
        }
    }
    
    if (!game.player || game.player.health == 0){
        game.player = new Player()
    }
}
    
let currentAnim
const bounce = () => {
    currentAnim = requestAnimationFrame(bounce)
    ctx.clearRect(0,0,canvas.width,canvas.height)
    Snake.snakes.forEach(snek => snek.drawSnake(ctx))
    Block.blocks.forEach(block => block.draw())
    Dart.darts.forEach(dart => dart.draw())
    game.player.draw()
    score.innerHTML = game.score
    health.innerHTML = `${game.player.health} / 100`
    if (game.player.health <= 0) {
        ctx.font = 'bold 48px sans-serif'
        ctx.fillStyle = `rgba(0,100,0,1)`
        cancelAnimationFrame(currentAnim)
        ctx.fillText("YOU DIED", 150, 300)
        ctx.fillText("FROM SNAKES", 90, 360)
        ctx.font = 'bold 36px sans-serif'
        ctx.fillText("click to restart", 150, 440)
        canvas.addEventListener("click", main)
    }
    if (!Snake.snakes.length) {
        ctx.font = 'bold 48px sans-serif'
        ctx.fillStyle = `rgba(0,100,0,1)`
        cancelAnimationFrame(currentAnim)
        ctx.fillText("YOU BEAT", 150, 300)
        ctx.fillText(`LEVEL ${game.level}!`, 165, 360)
        ctx.font = 'bold 36px sans-serif'
        ctx.fillText("click to continue", 150, 440)
        canvas.addEventListener("click", main)
    }
}

const main = () => {
    canvas.removeEventListener("click", main)
    if (game.player && game.player.health > 0) {
        game.level++
    } else {
        game.level = 1
    }
    level.innerText = game.level

    // clear any previous game
    for (list of [Snake.snakes, Block.blocks, Dart.darts]) {
        while (list.length) {
            list[0].remove()
        }
    }

    if (ctx) {
        initialize()
        bounce()
        game.player.exist()
    } else {
    // canvas-unsupported code here
    info.innerHTML = `
        <div class="not-supported">
            This game requires a browser that supports the Canvas API. Sorry!
        </div>
    `
    }
}

if (ctx) {
    ctx.fillStyle = `rgba(0,100,0,1)`
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText("click to start", 160, 440)
    addEventListener('keypress',(e)=>{
        switch (e.key) {
            case "w":
                game.player.move(0,-2, true)
                break
            case "s":
                game.player.move(0,4)
                break
            case "a":
                game.player.move(-2,0)
                break
            case "d":
                game.player.move(2,0)
                break
            case " ":
                if (Dart.lastFired + DART_DELAY < new Date().getTime()){
                    new Dart({x: game.player.position.x + PLAYER_WIDTH/8*3, y: game.player.position.y})
                }
        }
    })
    canvas.addEventListener("click", main)
}

