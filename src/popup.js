import React from "react";
import ReactDOM from "react-dom";
import {EventEmitter} from "events";
import {Datum,ProxyStorage} from "./storage.js";
import {StateContainer, ContainerComponent, DispatchableComponent} from "./flux.js"


class AppContainer extends ContainerComponent {
    constructor(...args) {
        super(...args);
        this.storage = new ProxyStorage();
    }

    render() {
        return <div className="wrapper">
            <Toast message={this.state.message}/>
            <Editor note={this.state.note}/>
        </div>
    }
}

class Editor extends DispatchableComponent {

    render() {
        return (
            <textarea className="editor"
                      onChange={(ev) => this.dispatch("editor-change", ev.target.value)}
                      onKeyDown={(ev) => this.dispatch("editor-keydown", ev)}
                      value={this.props.note}
            />
        );
    }
}

class Toast extends DispatchableComponent {
    constructor(...args) {
        super(...args);
        this.state = {
            timer: null
        }
    }

    resetTimer() {
        if (this.state.timer != null) {
            clearTimeout(this.state.timer);
            this.state.timer = null;
        }
        this.state.timer = setTimeout(() => {
            this.dispatch("hide-toast");
        }, 3000);
    }

    render() {
        const visible = (this.props.message && this.props.message.length > 0);
        if (visible) {
            this.resetTimer();
            return (
                <div className="toast">{this.props.message}</div>
            );
        }
        return null;
    }
}


const container = new StateContainer({
    url: "",
    note: "",
    message: null
});


ReactDOM.render(
    <AppContainer container={container}/>,
    document.querySelector(".main")
);



container.on("editor-load", ()=> {
    chrome.tabs.getSelected(null, (tab) => {
        const url = tab.url.match(/^(http|https|ftp|file):\/{2,3}([0-9a-z\.\-]+)(:[0-9]*)?\//i)[2];
        container.root.storage.get(url, (datum) => {
            const loaded = (datum.value && datum.value.length > 0);
            container.state.url = url;
            container.state.note = (loaded ? datum.value : "");
            container.state.message = (loaded ? "loaded!" : "ready!");
            container.commit();
        });
    });
});


container.on("editor-save", ()=> {
    const datum = new Datum(
        container.state.url,
        container.state.note
    );
    container.root.storage.set(
        datum,
        () => container.emitter.emit("show-toast", "saved!")
    );
});

container.on("editor-change", (note) => {
    container.state.note = note;
});

container.on("editor-keydown", (ev) => {
    if (ev.shiftKey && ev.keyCode === 13) {
        ev.preventDefault();
        container.emitter.emit("editor-save");
    }
});

container.on("show-toast", (message) => {
    container.state.message = message;
});

container.on("hide-toast", () => {
    container.state.message = null;
});

container.emitter.emit("editor-load");
