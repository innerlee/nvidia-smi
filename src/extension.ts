// The module 'vscode' contains the VS Code extensibility API
// Import the necessary extensibility types to use in your code below
import { window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem } from 'vscode'
import { platform } from 'os'
const exec = require('child-process-promise').exec;
const heightChars = ['_', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
const cmd = `nvidia-smi -q -d UTILIZATIONnvidia-smi -q -d UTILIZATION | grep Gpu | sed 's/[Gpu%: ]//g'`

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error).
    // This line of code will only be executed once when your extension is activated.
    console.log('Congratulations, your extension "nvidia-smi" is now active!')

    // create a new word counter
    let nvidiasmi = new NvidiaSmi(0)
    try {
        var res = await exec(cmd);
        var nCard = res.stdout.split('\n').filter((val) => val).length
        if (nCard > 0) {
            nvidiasmi.nCard = nCard
            nvidiasmi.startNvidiaSmi()
        }
    } catch (e) {
        console.log(e)
        nvidiasmi.nCard = 0
    }

    let updateCmd = commands.registerCommand('extension.nvidia-smi', () => {
        nvidiasmi.updateNvidiaSmi()
    })

    let stopCmd = commands.registerCommand('extension.stop_nvidia-smi', () => {
        nvidiasmi.stopNvidiaSmi()
    })

    let startCmd = commands.registerCommand('extension.start_nvidia-smi', () => {
        nvidiasmi.startNvidiaSmi()
    })

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(nvidiasmi)
    context.subscriptions.push(updateCmd)
    context.subscriptions.push(startCmd)
    context.subscriptions.push(stopCmd)
}

class NvidiaSmi {

    private _statusBarItem: StatusBarItem
    private _interval: NodeJS.Timer
    private _nCard: number;

    constructor(numCard: number) {
        this.nCard = numCard;
    }

    get nCard(): number {
        return this._nCard;
    }

    set nCard(numCard: number) {
        if (numCard >= 0) {
            this._nCard = numCard;
        }
        else {
            console.log("Error: bad value of numCard!");
        }
    }

    public async updateNvidiaSmi() {

        if (this.nCard == 0) return

        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left)
        }

        try {
            var res = await exec(cmd);
            var levels = res.stdout.split('\n').filter((val) => val)
            var levelChars = levels.map((val) => heightChars[Math.ceil(Number(val) / 100 * 8)])

        } catch (e) {
            console.log(e)
            this._nCard = 0
        }

        // Update the status bar
        this._statusBarItem.text = levelChars.join('')
        this._statusBarItem.tooltip = levels.map((val) => `${val} %`).join('\n')
        this._statusBarItem.show()
    }

    public async stopNvidiaSmi() {
        if (this._interval) {
            clearInterval(this._interval)
        }
        if (this._statusBarItem) {
            this._statusBarItem.text = ''
            this._statusBarItem.tooltip = ''
            this._statusBarItem.show()
        }
    }

    public async startNvidiaSmi() {
        if (this.nCard == 0) return

        this._interval = setInterval(() => {
            this.updateNvidiaSmi()
        }, 1000);
    }

    dispose() {
        this._statusBarItem.dispose()
        if (this._interval) {
            clearInterval(this._interval)
        }
    }
}
