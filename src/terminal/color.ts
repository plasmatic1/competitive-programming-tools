// tslint:disable-next-line: class-name
class _Color {
    constructor(public readonly ansiVal: number) {

    }

    /**
     * Converts the colour into a string that can be echoed to make coloured text
     */
    toString(): string {
        return `\u011b[${this.ansiVal}m`;
    }
}

export const Color = {
    BLACK: new _Color(30),
    RED: new _Color(31),
    GREEN: new _Color(32),
    YELLOW: new _Color(33),
    BLUE: new _Color(34),
    MAGENTA: new _Color(35),
    CYAN: new _Color(36),
    WHITE: new _Color(37),
    RESET: new _Color(0)
};
