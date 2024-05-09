/* eslint-disable eqeqeq */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-anonymous-default-export */
import React, { useState, useEffect } from 'react';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import * as XLSX from 'xlsx';

import './index.css';
import s from './style.module.scss';

const { Dragger } = Upload;

export default () => {
    const [fileList, setFileList]: any = useState([]);
    const [fileResult, setFileResult]: any = useState([]);
    const [flag, setFlag]: any = useState(false);

    const handleRemove = (file: any) => {
        const newList = fileList.filter((item: any) => item.uid !== file.uid);
        setFileList(newList);
        const newResult = fileResult.filter((item: any) => item.uid !== file.uid);
        setFileResult(newResult);
    };

    const handleProcessFile = async (files: any) => {
        let results = "";
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Kiểm tra nếu file có uid không thuộc trong mảng fileResult
            if (!fileResult.find((item: any) => item.uid === file.uid)) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);

                const workbook: any = await new Promise((resolve, reject) => {
                    reader.onload = (e: any) => {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        resolve(workbook);
                    };
                    reader.onerror = (error) => {
                        reject(error);
                    };
                });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData: any = XLSX.utils.sheet_to_json(worksheet, { raw: true, header: 1 });
                console.log(jsonData);

                // Lọc dữ liệu
                const filteredData: string[] = [];
                for (let row = 0; row < jsonData.length; row++) {
                    let count = 0;
                    const rowData: any = jsonData[row];
                    for (let col = 0; col < rowData.length - 1; col += 2) {
                        const num1 = Number(rowData[col]) % 100;
                        const num2 = Number(rowData[col + 1]) % 100;
                        if (Math.floor(num1) === Math.floor(num2) || num1 % 10 === num2 % 10 || Math.floor(num1 / 10) === Math.floor(num2 / 10)) {
                            count = count + 1;
                        }
                    }
                    if (count > 0)
                        filteredData.push(`Hàng ${row + 1} trùng ${count} lần`);
                }
                results = results + filteredData.join('; ');
            }

            const uid = file.uid;
            setFileResult([...fileResult, { uid: uid, result: results }]);
        }
    };


    useEffect(() => {
        if (fileList.length > 0 && fileList.length > fileResult.length) {
            setFlag(true); // Đặt cờ flag thành true khi fileList thay đổi
            handleProcessFile(fileList);
            setFlag(false); // Đặt cờ flag thành false sau khi xử lý xong
        }
    }, [fileList]);

    return (
        <>
            <Dragger
                fileList={fileList}
                beforeUpload={(file: any) => {
                    const isDuplicate = fileList.some((item: any) => item.uid === file.uid);
                    if (isDuplicate) {
                        message.error('File đã tồn tại trong danh sách!');
                        return false; // Không thêm file vào fileList
                    } else {
                        setFileList([...fileList, file]);
                        return false; // Ngăn chặn việc tải lên tự động
                    }
                }}
                onRemove={(file: any) => handleRemove(file)}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Nhấn vào đây để tải lên file excel</p>
                <p className="ant-upload-hint">
                    Chỉ xử lý file excel có đuôi xlsx, các file dạng khác không xử lý được
                </p>
            </Dragger>
            {fileList.map((file: any, index: any) => (
                <div key={file.uid} style={{ marginTop: '10px' }}>
                    <p>Kết quả lọc file {file.name}:</p>
                    <div className="rectangle-frame">
                        {fileResult[index]?.result?.split(';')?.map((content: any) => (
                            <div className="file-name">{content}</div>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}