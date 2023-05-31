export const a = 1;
// import { DavClient, STATUS_CODES } from "davlib";

// interface DirContent {
//   dirList: string[];
//   fileList: string[];
// }

// interface WebdavOptions {
//   protocol?: string;
//   host: string;
//   port?: number;
//   username: string;
//   password: string;
//   rootDir: string;
//   success?: (dirContent: DirContent) => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface ListDirOptions {
//   dir: string;
//   success?: (dirContent: DirContent) => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface CreateDirOptions {
//   dir: string;
//   success?: () => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface MoveFileOptions {
//   src: string;
//   dest: string;
//   success?: () => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface CopyFileOptions {
//   src: string;
//   dest: string;
//   success?: () => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface DeleteFileOptions {
//   file: string;
//   success?: () => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// interface UploadFileOptions {
//   fileName: string;
//   remoteDir: string;
//   fileData: any;
//   success?: (content: any) => void;
//   error?: (errorCode: number, errorMsg: string) => void;
// }

// export class Webdav {
//   private client: DavClient;
//   private host: string;
//   private port: number;
//   private protocol: string;
//   private username: string;
//   private password: string;
//   private debug = false;

//   constructor() {
//     this.client = new DavClient();
//     this.host = "";
//     this.port = 80;
//     this.protocol = "http";
//     this.username = "";
//     this.password = "";
//     this.debug = false;
//   }

//   private extractDirContent(
//     webdavResponse: string,
//     browsedDirectory: string
//   ): DirContent {
//     if (this.debug)
//       console.log("extractDirContent() - WebdavResponse : " + webdavResponse);
//     const dirContent: DirContent = { dirList: [], fileList: [] };
//     // const xmlDoc = $.parseXML(webdavResponse);
//     // const filterOnlyDirectoryContent = new RegExp(browsedDirectory + "/?[^/]+");
//     // $(xmlDoc)
//     //   .find('response, D\\:response, DAV\\:response')
//     //   .each(function (undefined) {
//     //     const fileContentType = $(this).find('getcontenttype, D\\:getcontenttype, DAV\\:getcontenttype').text();
//     //     const isDir = fileContentType == 'httpd/unix-directory';
//     //     const fileHref = $(this).find('href, D\\:href, DAV\\:href').text();
//     //     const file = decodeURI(fileHref);
//     //     if (file.match(filterOnlyDirectoryContent)) {
//     //       const filename = file.replace(/^.*\/([^\/]+)\/*$/, '$1')
//     //       if (isDir) {
//     //         dirContent.dirList.push(filename);
//     //       } else {
//     //         dirContent.fileList.push(filename);
//     //       }
//     //     }
//     //   });
//     dirContent.dirList.sort();
//     dirContent.fileList.sort();
//     if (this.debug) console.log(dirContent);
//     return dirContent;
//   }

//   private responseHandler(
//     expectedStatus: number,
//     contentWrapper?: (content: any, contentWrapperArg?: any) => any,
//     contentWrapperArg?: any
//   ) {
//     return (status: number, statusstr: string, content: any) => {
//       if (status == expectedStatus) {
//         if (contentWrapper) {
//           contentWrapper(content, contentWrapperArg);
//         }
//       } else {
//         console.log("UnexpectedStatus :" + status + " - " + statusstr);
//       }
//     };
//   }

//   private catchCallError(
//     err: any,
//     errorCallback?: (errorCode: number, errorMsg: string) => void
//   ) {
//     console.log(err);
//     if (errorCallback) {
//       let msg = "Unable to call remote server";
//       if (err.message) {
//         msg += ", " + err.message;
//       }
//       errorCallback(err.name, msg);
//     }
//   }

//   public connect(options: WebdavOptions) {
//     if (this.debug)
//       console.log(
//         "initialize() - Protocol=" +
//           options.protocol +
//           " Host=" +
//           options.host +
//           " Port=" +
//           options.port +
//           " username=" +
//           options.username +
//           " RootDir=" +
//           options.rootDir
//       );
//     this.host = options.host;
//     this.port = options.port || 80;
//     this.protocol = options.protocol || "http";
//     this.username = options.username;
//     this.password = options.password;
//     this.client.initialize(
//       this.host,
//       this.port,
//       this.protocol,
//       this.username,
//       this.password
//     );
//     this.listDir({
//       dir: options.rootDir,
//       success: options.success,
//       error: options.error,
//     });
//   }

//   public listDir(options: ListDirOptions) {
//     if (this.debug) console.log("listDir() : dir=" + options.dir);
//     try {
//       this.client.PROPFIND(
//         options.dir,
//         this.responseHandler(
//           207,
//           this.extractDirContent.bind(this),
//           options.dir
//         ),
//         null,
//         1
//       );
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public createDir(options: CreateDirOptions) {
//     if (this.debug) console.log("createDir() - Dir : " + options.dir);
//     try {
//       this.client.MKCOL(options.dir, this.responseHandler(201));
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public moveFile(options: MoveFileOptions) {
//     if (this.debug)
//       console.log("moveFile() - File : " + options.src + " to " + options.dest);
//     try {
//       this.client.MOVE(options.src, options.dest, this.responseHandler(201));
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public copyFile(options: CopyFileOptions) {
//     if (this.debug)
//       console.log("copyFile() - File : " + options.src + " to " + options.dest);
//     try {
//       this.client.COPY(options.src, options.dest, this.responseHandler(201));
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public deleteFile(options: DeleteFileOptions) {
//     if (this.debug) console.log("deleteFile() - File : " + options.file);
//     try {
//       this.client.DELETE(options.file, this.responseHandler(204));
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public uploadFile(options: UploadFileOptions) {
//     if (this.debug)
//       console.log("Upload of " + options.fileName + " in " + options.remoteDir);
//     try {
//       const req = new XMLHttpRequest();
//       req.open(
//         "PUT",
//         `${this.protocol}://${this.host}:${this.port}${options.remoteDir}${options.fileName}`,
//         true
//       );
//       req.setRequestHeader(
//         "Authorization",
//         "Basic " + btoa(`${this.username}:${this.password}`)
//       );
//       req.onreadystatechange = () => {
//         if (req.readyState == 4) {
//           if (this.debug)
//             console.log(
//               "Upload of " + options.fileName + " status : " + req.status
//             );
//           if (req.status == 200 || req.status == 201) {
//             if (options.success) options.success(req.responseText);
//           } else {
//             if (options.error)
//               options.error(req.status, STATUS_CODES[req.status]);
//           }
//         }
//       };
//       req.send(options.fileData);
//     } catch (err) {
//       this.catchCallError(err, options.error);
//     }
//   }

//   public openFile(file: string) {
//     if (this.debug) console.log("openFile() - File : " + file);
//     try {
//       window.open(
//         `${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}${file}`,
//         "_blank"
//       );
//     } catch (err) {
//       console.log(err);
//       window.open(
//         `${this.protocol}://${this.host}:${this.port}${file}`,
//         "_blank"
//       );
//     }
//   }
// }
