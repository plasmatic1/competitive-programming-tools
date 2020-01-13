// tslint:disable-next-line: class-name
class _Color {
    private ansiVal: number;
    private extra: string;
    constructor(_ansiVal: number, _extra: string = '') {
        this.ansiVal = _ansiVal;
        this.extra = _extra;
    }

    /**
     * Converts the colour into a string that can be echoed to make coloured text
     */
    toString(): string {
        return `\x1b[${this.ansiVal}${this.extra}m`;
    }

    /**
     * Converts the colour into its bright version
     */
    bright(): _Color {
        return new _Color(this.ansiVal, this.extra + ';1');
    }

    /**
     * Converts the colour into its background version
     */
    bg(): _Color {
        return new _Color(this.ansiVal + 10, this.extra);
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
