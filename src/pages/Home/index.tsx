import React, { useState } from 'react';
import { Header } from './Header';
import { Left } from './Left';
import { Right } from './Right';
import { Center } from './Center';
import { INode } from "../../engine";


export function Home() {
    const data = useHome();

    return (
        <main className="p-home">
            <Header />
            <Left {...{
                activeNode: data.activeNode,
                setActiveNode: data.setActiveNode
            }} />
            <Center />
            <Right {...{
                activeNode: data.activeNode,
                setActiveNode: data.setActiveNode
            }} />
        </main>
    )
}

function useHome() {
    let [activeNode, setActiveNode] = useState<INode>();
    return { activeNode, setActiveNode }
}
