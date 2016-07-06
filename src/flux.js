import React from "react";
import {EventEmitter} from "events";

export class StateContainer {
    constructor(initialState, shouldUpdate) {
        this.root = undefined;
        this.state = initialState;
        this.prevState = Object.assign({}, initialState);
        this.emitter = new EventEmitter();
        this.shouldUpdate = shouldUpdate || ((a, b) => true);
    }

    register(rootComponent) {
        this.root = rootComponent;
        this.root.state = this.prevState;
    }

    // 今はonだけ
    on(type, listener) {
        // ここの関数合成の筋が悪すぎてしんどい
        return this.emitter.on(type, (...args) => {
            listener(...args);
            this.commit();
        });
    }

    commit() {
        if (this.shouldUpdate(this.prevState, this.state))
            this.root.setState(this.state);
        this.prevState = Object.assign({}, this.state);
    }
}

// React.Component 拡張

const ContainerContextTypes = {
    container: React.PropTypes.any
};
export class ContainerComponent extends React.Component {
    static get childContextTypes() {
        return ContainerContextTypes;
    }

    constructor(...args) {
        super(...args);
        this.props.container.register(this);
    }

    getChildContext() {
        return {
            container: this.props.container
        };
    }
}

export class DispatchableComponent extends React.Component {
    static get contextTypes() {
        return ContainerContextTypes;
    }

    dispatch(...args) {
        const container = this.context.container;
        return container.emitter.emit(...args);
    }
}

