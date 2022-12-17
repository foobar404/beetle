import React from 'react';
import { engine, IImage, INode } from "../../engine";


interface IProps {
    activeNode?: INode;
    setActiveNode: (node: INode) => void;

}

export function Right(props: IProps) {
    const data = useRight(props);

    return (
        <aside className="__section-right">
            <section>
                {props.activeNode?.name}
            </section>

            <section>
                {Object.keys(props.activeNode?.events ?? {}).map((key: string) => {
                    return key
                })}
            </section>

            <section>
                {props.activeNode?.height}
            </section>

            <section>
                <select id="image-dropdown">
                    {Object.keys(engine.assets).map(name => {
                        let asset = engine.assets[name];
                        if (asset.type === "image")
                            return (<option value={name}>{name}</option>)
                    })}
                </select>
                <button onClick={data.addImage}>Add Image</button>

                {props.activeNode?.images?.map((image: IImage) => {
                    return (<div>
                        {image.name}
                        <img src={engine.assets[image.name].output} />
                    </div>)
                })}
            </section>

            <section>
                {props.activeNode?.physics}
            </section>

            <section>
                {props.activeNode?.shape}
            </section>

            {/* {props.activeNode?.state} */}

            <section>
                {props.activeNode?.tags}
            </section>

            <section>
                {props.activeNode?.height}
            </section>

            <section>
                {props.activeNode?.width}
            </section>

            <section>
                {props.activeNode?.x}
            </section>

            <section>{props.activeNode?.y}</section>
        </aside>
    )
}

function useRight(props: IProps) {
    let [refresh, setRefresh] = React.useState(0);

    function addImage() {
        let image = document.getElementById("image-dropdown") as HTMLSelectElement;
        let name = image.value;
        let asset = engine.assets[name];
        if (!asset) return;

        console.log(name)

        props.activeNode?.addImage(name);
        setRefresh(refresh + 1);
    }

    return {
        addImage
    }
}
