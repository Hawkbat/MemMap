
export abstract class Action {
    public abstract do(): void
    public abstract redo(): void
    public abstract undo(): void
}
