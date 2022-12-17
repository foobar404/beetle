export interface IAsset {
    name: string;
    path: string;
    output?: any;
    type?: string | null;
    blob?: Blob;
}

export interface IImage {
    asset: string | null;
    name: string;
    x: number;
    y: number;
    frames: IFrame[];
    frameRate: number;
    startingFrame: number;
    autoPlay: boolean;
    loop: boolean;
    _currentFrame: number;
    _lastFrameTime: number;
    _playing: boolean;
}

export interface INode {
    name: string;
    height: number;
    width: number;
    x: number;
    y: number;
    physics: 'dynamic' | 'passive' | 'solid' | 'static' // ([moveable, collidable] [yes yes] [yes no] [no yes] [no no])
    shape: 'square' | 'circle';
    state: any;
    children: INode[];
    images: IImage[];
    tags: string[];
    events: { [key: string]: (props: any) => void }
    addImage: (assetName: string) => void;
    play: (name: string, loop?: boolean) => void;
    stop: (name?: string) => void;
    start: () => void;
    update: (tick: number) => void;
    listen: (name: string, callback: () => void) => void;
}

export interface ILevel {
    name: string;
    nodes: INode[];
}

export interface IFrame {
    x: number;
    y: number;
    height: number;
    width: number;
}

export interface IEngineSettings {
    autoScale: boolean;
    canvas: HTMLCanvasElement | null;
    context: CanvasRenderingContext2D | null;
    level: string;
    mouseX: number;
    mouseY: number;
    mouseDown: boolean;
    mouseUp: boolean;
    tick: number;
}

export const engine = {
    // properties
    assets: <{ [name: string]: IAsset }>{},
    state: <any>{},
    levels: <{ [name: string]: ILevel }>{
        'default': {
            name: 'default',
            nodes: []
        }
    },
    settings: <IEngineSettings>{
        canvas: null,
        context: null,
        level: "default",
        tick: 0,
        mouseX: 0,
        mouseY: 0,
        mouseDown: false,
        mouseUp: false,
        autoScale: false,
    },
    start: () => {
        engine._loadAssets();
        engine._listen();
        engine._createCanvas();
        engine._startNodes();
        engine._loop(0);
    },
    // core game loop functions 
    _loadAssets: () => {
        Object.keys(engine.assets).forEach(assetName => {
            const asset = engine.assets[assetName];
            let fileEnding = asset.path.split('.').pop() ?? "";
            let image = ["png", "jpg", "jpeg", "gif", "bmp"];
            let audio = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "wma"];
            let video = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv", "3gp"];

            if (image.includes(fileEnding)) {
                let img = new Image();
                img.src = asset.path;
                asset.output = img;
                asset.type = "image";

                if (asset.blob)
                    img.src = URL.createObjectURL(asset.blob);
            } else if (audio.includes(fileEnding)) {
                let audio = new Audio();
                audio.src = asset.path;
                asset.output = audio;
                asset.type = "audio";
            } else if (video.includes(fileEnding)) {
                let video = document.createElement('video');
                video.src = asset.path;
                asset.output = video;
                asset.type = "video";
            }
        });
    },
    _createCanvas: () => {
        let canvas = !engine.settings.canvas ? document.createElement('canvas') : engine.settings.canvas;
        if (!engine.settings.canvas) document.body.appendChild(canvas);

        engine.settings.canvas = canvas;
        engine.settings.context = canvas.getContext('2d');

        if (engine.settings.autoScale) {
            canvas.width = canvas.parentElement!.clientWidth;
            canvas.height = canvas.parentElement!.clientHeight;
        }
    },
    _startNodes: () => {
        let level = engine.levels[engine.settings.level];
        level.nodes.forEach(node => node.start());
    },
    _loop: (tick: DOMHighResTimeStamp) => {
        if (engine.settings.tick == 0) engine.settings.tick = tick;
        let delta = tick - engine.settings.tick;

        engine.settings.tick = tick;
        engine._update(delta);
        engine._paint(delta);
        requestAnimationFrame(engine._loop);
    },
    _update: (tick: number) => {
        let level = engine.levels[engine.settings.level];
        level.nodes.forEach(node => node.update(tick));
    },
    _paint: (tick: number) => {
        engine.settings.context!.clearRect(0, 0, engine.settings.canvas!.width, engine.settings.canvas!.height);

        let level = engine.levels[engine.settings.level];
        level.nodes.forEach((node: INode) => {
            node.images.forEach((image: IImage) => {
                let asset = engine.assets[image.asset!].output;
                let frame = image.frames[image._currentFrame];
                let x = node.x + image.x;
                let y = node.y + image.y;

                if (image._playing) {
                    image._lastFrameTime += tick;
                }
                if (image._lastFrameTime > (1000 / image.frameRate)) {
                    image._lastFrameTime = 0;
                    image._currentFrame++;
                }
                if (image._currentFrame >= image.frames.length) {
                    image._currentFrame = 0;
                }

                engine.settings.context!.drawImage(
                    asset,
                    frame.x,
                    frame.y,
                    frame.height,
                    frame.width,
                    x,
                    y,
                    frame.height,
                    frame.width
                );
            });
        });
    },
    // utility functions
    createNode: (override?: any) => {
        let node: INode = {
            name: '',
            height: 0,
            width: 0,
            x: 0,
            y: 0,
            physics: 'dynamic',
            shape: 'square',
            state: {},
            children: [],
            images: [],
            tags: [],
            events: {},
            play: (name: string, loop?: boolean) => {
                let image = node.images.find(image => image.name === name);
                if (!image) return console.error(`Image with name ${name} does not exist on node ${node.name}`);

                image._currentFrame = image.startingFrame;
                image.loop = loop ?? true;
                image._playing = true;
            },
            stop: (name?: string) => {
                if (name) {
                    let image = node.images.find(image => image.name === name);
                    if (!image) return console.error(`Image with name ${name} does not exist on node ${node.name}`);

                    image._playing = false;
                } else {
                    node.images.forEach(image => image._playing = false);
                }
            },
            addImage: (assetName: string) => {
                let asset = engine.assets[assetName];
                if (!asset) return console.error(`Asset with name ${assetName} does not exist`);

                let image: IImage = {
                    name: assetName,
                    asset: assetName,
                    x: 0,
                    y: 0,
                    frames: [],
                    frameRate: 30,
                    startingFrame: 0,
                    loop: true,
                    autoPlay: true,
                    _currentFrame: 0,
                    _playing: false,
                    _lastFrameTime: 0,
                };

                let img = asset.output as HTMLImageElement;
                image.frames.push({
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height
                });

                node.images.push(image);
            },
            start: () => { },
            update: (tick: number) => { },
            listen: (name: string, callback: () => void) => {
                node.events[name] = callback;
            }
        };

        return { ...node, ...override };
    },
    addNode: (node: INode) => {
        let level = engine.levels[engine.settings.level];
        level.nodes.push(node);
        node.start();
    },
    getNode: (name: string) => {
        let level = engine.levels[engine.settings.level];
        return level.nodes.find(node => node.name === name);
    },
    removeNode: (node: INode) => {
        let level = engine.levels[engine.settings.level];
        level.nodes = level.nodes.filter(n => n.name !== node.name);
    },
    createImage: () => {
        let image: IImage = {
            name: '',
            asset: null,
            frames: [],
            x: 0,
            y: 0,
            frameRate: 10,
            startingFrame: 0,
            autoPlay: false,
            loop: true,
            _currentFrame: 0,
            _lastFrameTime: 0,
            _playing: false
        };

        return image;
    },
    addAssets: (assets: IAsset[]) => {
        assets.forEach(asset => {
            let newAsset: IAsset = {
                ...asset,
                name: asset.name ?? asset.path,
            };
            engine.assets[newAsset.name] = newAsset;
        });
    },
    trigger: (name: string, data: any) => {
        engine._forEachNode(node => {
            if (node.events[name]) node.events[name](data);
        });
    },
    play: (audioName: string) => {
        let audio = engine.assets[audioName].output;
        audio.play();
    },
    stop: (audioName: string) => {
        let audio = engine.assets[audioName].output;
        audio.pause();
    },
    _listen: () => {
        window.addEventListener('resize', (e) => {
            if (engine.settings.autoScale) {
                engine.settings.canvas!.width = engine.settings.canvas!.parentElement!.clientWidth;
                engine.settings.canvas!.height = engine.settings.canvas!.parentElement!.clientHeight;
            }
        }, true);
        document.addEventListener('keyup', (e) => {
            let event = { event: 'keyup', key: e.key, code: e.code };

            engine._forEachNode(node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('keydown', (e) => {
            let event = { event: 'keydown', key: e.key, code: e.code };

            engine._forEachNode(node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('keypress', (e) => {
            let event = { event: 'keypress', key: e.key, code: e.code };

            engine._forEachNode(node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('mousemove', (e) => {
            let event = { event: 'mousemove', x: e.clientX, y: e.clientY };

            engine.settings.mouseX = event.x;
            engine.settings.mouseY = event.y;

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('mousedown', (e) => {
            let event = { event: 'mousedown', x: e.clientX, y: e.clientY };

            engine.settings.mouseDown = true;
            engine.settings.mouseUp = false;

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('mouseup', (e) => {
            let event = { event: 'mouseup', x: e.clientX, y: e.clientY };

            engine.settings.mouseUp = true;
            engine.settings.mouseDown = false;

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('click', (e) => {
            let event = { event: 'click', x: e.clientX, y: e.clientY };

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('dblclick', (e) => {
            let event = { event: 'dblclick', x: e.clientX, y: e.clientY };

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('contextmenu', (e) => {
            let event = { event: 'contextmenu', x: e.clientX, y: e.clientY };

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        document.addEventListener('wheel', (e) => {
            let event = { event: 'wheel', x: e.clientX, y: e.clientY, delta: e.deltaY };

            engine._forEachNodeAtPoint(engine.settings.mouseX, engine.settings.mouseY, node => {
                if (node.events[event.event]) node.events[event.event](event);
            });
        });
        // document.addEventListener('touchstart', (e) => {
        //     let event = { event: 'touchstart', x: e.touches[0].clientX, y: e.touches[0].clientY };

        //     engine._forEachNode(node => {
        //         if (node.events[event.event]) node.events[event.event](event);
        //     });
        // });
        // document.addEventListener('touchend', (e) => {
        //     let event = { event: 'touchend', x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };

        //     engine._forEachNode(node => {
        //         if (node.events[event.event]) node.events[event.event](event);
        //     });
        // });
        // document.addEventListener('touchmove', (e) => {
        //     let event = { event: 'touchmove', x: e.touches[0].clientX, y: e.touches[0].clientY };

        //     engine._forEachNode(node => {
        //         if (node.events[event.event]) node.events[event.event](event);
        //     });
        // });
    },
    _forEachNode: (callback: (child: INode) => void, nodeList?: INode[]) => {
        if (!nodeList) nodeList = engine.levels[engine.settings.level].nodes;

        nodeList.forEach(node => {
            engine._forEachNode(callback, node.children);
            callback(node);
        });
    },
    _forEachNodeAtPoint: (x: number, y: number, callback: (child: INode) => void, nodeList?: INode[]) => {
        if (!nodeList) nodeList = engine.levels[engine.settings.level].nodes;

        let nodes = nodeList.filter(n => (
            x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height
        ));

        nodes.forEach(node => {
            engine._forEachNodeAtPoint(x, y, callback, node.children);
            callback(node);
        });
    },
}



