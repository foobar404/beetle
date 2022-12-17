import React from 'react';
import { useEffect } from 'react';
import { ImPlus } from "react-icons/im";
import { engine, IAsset, INode } from '../../engine';


interface IProps {
    activeNode?: INode;
    setActiveNode: (node: INode) => void;
}

export function Left(props: IProps) {
    const data = useLeft(props);

    return (
        <section className="__section-left">
            <nav>
                <button className="c-button"
                    onClick={() => data.newNode()}>
                    <ImPlus />
                </button>
            </nav>
            <section>
                {engine.levels[engine.settings.level].nodes.map((node: INode) => data.renderNestedChildren(node))}
            </section>

            <br />
            <br />
            <br />
            <br />
            <br />
            <br />
            <section>
                <button onClick={data.loadFolder}>
                    Load Folder
                </button>

                {Object.keys(engine.assets).map(key => {
                    const asset = engine.assets[key];
                    return (
                        <div key={key}>
                            {asset.name}
                        </div>
                    );
                })}
            </section>
        </section>
    )
}

function useLeft(props: IProps) {
    let [refresh, setRefresh] = React.useState(0);
    let [nodeCount, setNodeCount] = React.useState(1);

    useEffect(() => {
        engine.addNode(engine.createNode({ name: "node #0" }));
        setRefresh(refresh + 1);
    }, []);

    async function loadFolder() {
        const files: { [key: string]: Blob } = {};
        const dirHandle = await (window as any).showDirectoryPicker();
        await handleDirectoryEntry(dirHandle, files);

        let assets: IAsset[] = [];
        Object.keys(files).forEach(fileName => {
            assets.push({
                name: fileName,
                path: fileName,
                blob: files[fileName],
            });
        });

        engine.addAssets(assets);
        engine._loadAssets();
        setRefresh(refresh + 1);
        (window as any).engine = engine; // for debugging
    }

    async function handleDirectoryEntry(dirHandle: any, files: any) {
        for await (const entry of dirHandle.values()) {
            if (entry.kind === "file") {
                const file = await entry.getFile();
                files[file.name] = file;
            }
            if (entry.kind === "directory") {
                let nestedFiles = { };
                await handleDirectoryEntry(entry, nestedFiles);
                console.log(files, nestedFiles);
            }
        }
    }

    function newNode(rootNode?: INode) {
        let node = engine.createNode();
        node.name = "node #" + nodeCount;

        if (rootNode) rootNode.children.push(node);
        else engine.addNode(node);

        setNodeCount(nodeCount + 1);
    }

    function renderNestedChildren(node: INode, depth: number = 0): React.ReactNode {
        return (<React.Fragment key={node.name}>
            <div style={{ border: "2px solid black" }}
                onClick={() => props.setActiveNode(node)}>

                <input type="text" defaultValue={node.name} />
                <button className="c-button"
                    onClick={() => newNode(node)}>
                    <ImPlus />
                </button>
            </div>
            {node.children.map((child: INode) => renderNestedChildren(child, depth + 1))}
        </React.Fragment>)
    }

    return {
        loadFolder,
        newNode,
        renderNestedChildren
    }
}
