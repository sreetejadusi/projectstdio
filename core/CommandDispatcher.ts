export type CommandType = 
  | 'changeName' 
  | 'changeShirtColour' 
  | 'setEnergy' 
  | 'wave' 
  | 'walkRight' 
  | 'jump';

export interface Command {
  type: CommandType;
  target?: string;
  payload?: any;
}

// Global dispatcher to allow components to easily listen and trigger commands
export class CommandDispatcher {
  private static listeners: ((cmd: Command) => void)[] = [];

  static subscribe(listener: (cmd: Command) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static dispatch(command: Command) {
    this.listeners.forEach(listener => listener(command));
  }
}
