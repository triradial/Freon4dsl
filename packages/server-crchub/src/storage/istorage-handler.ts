export interface IStorageHandler {
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    deleteFile(filePath: string): Promise<void>;
    fileExists(filePath: string): Promise<boolean>;
    listFiles(dirPath: string): Promise<string[]>;
    listDirectories(dirPath: string): Promise<string[]>;
    ensureDirectory(dirPath: string): Promise<void>;
    directoryExists(dirPath: string): Promise<boolean>;
    deleteDirectory(dirPath: string): Promise<void>;
} 