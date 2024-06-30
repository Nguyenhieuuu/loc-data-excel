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

function findPositions(number1: any, number2: any, array: any) {
    let dem = false;
    let strFiveDigit = number1.toString();
    let strSingleDigit = number2.toString();

    // Duyệt qua từng ký tự trong chuỗi số có 5 chữ số
    for (let i = 0; i < strFiveDigit.length; i++) {
        if (strFiveDigit[i] === strSingleDigit) {
            array[i] = array[i] + 1;
            dem = true;
        }
    }
    return dem;
}

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

                // Lọc dữ liệu
                const filteredData: string[] = [];
                for (let row = 0; row < jsonData.length; row++) {
                    let count = 0;
                    let countDau = [0, 0, 0, 0, 0];
                    let countDuoi = [0, 0, 0, 0, 0];

                    const rowData: any = jsonData[row];
                    for (let col = 0; col < rowData.length - 1; col += 2) {
                        const num1 = Number(rowData[col]);
                        const num2chuc = Math.floor(Number(rowData[col + 1]) / 10);
                        const num2donvi = Number(rowData[col + 1]) % 10;
                        let check1 = false;
                        let check2 = false;
                        check1 = findPositions(num1, num2chuc, countDau);
                        check2 = findPositions(num1, num2donvi, countDuoi);
                        if (check1 || check2) {
                            count = count + 1;
                        }
                    }
                    if (count > 0)
                        filteredData.push(`Hàng ${row + 1} trùng ${count} lần | Đầu: ${countDau}| Đuôi: ${countDuoi}`);
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
                onRemove={(file: any) => handleRemove(file)}
            >
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
                            <>
                                <div className="file-name deeppink">{content?.split('|')[0]}</div>

                                <div className="file-name tab">
                                    {content?.split('|')[1]?.split(':')[0]}
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[1]?.split(':')[1]?.split(',')[0], 10) > 0 ? 'red' : ''}`} >
                                        Vị trí 1 trùng {content?.split('|')[1]?.split(':')[1]?.split(',')[0]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[1]?.split(':')[1]?.split(',')[1], 10) > 0 ? 'red' : ''}`} >
                                        Vị trí 2 trùng {content?.split('|')[1]?.split(':')[1]?.split(',')[1]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[1]?.split(':')[1]?.split(',')[2], 10) > 0 ? 'red' : ''}`} >
                                        Vị trí 3 trùng {content?.split('|')[1]?.split(':')[1]?.split(',')[2]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[1]?.split(':')[1]?.split(',')[3], 10) > 0 ? 'red' : ''}`} >
                                        Vị trí 4 trùng {content?.split('|')[1]?.split(':')[1]?.split(',')[3]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[1]?.split(':')[1]?.split(',')[4], 10) > 0 ? 'red' : ''}`} >
                                        Vị trí 5 trùng {content?.split('|')[1]?.split(':')[1]?.split(',')[4]} lần
                                    </div>
                                </div>

                                <div className="file-name tab">
                                    {content?.split('|')[2]?.split(':')[0]}
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[2]?.split(':')[1]?.split(',')[0], 10) > 0 ? 'green' : ''}`} >
                                        Vị trí 1 trùng {content?.split('|')[2]?.split(':')[1]?.split(',')[0]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[2]?.split(':')[1]?.split(',')[1], 10) > 0 ? 'green' : ''}`} >
                                        Vị trí 2 trùng {content?.split('|')[2]?.split(':')[1]?.split(',')[1]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[2]?.split(':')[1]?.split(',')[2], 10) > 0 ? 'green' : ''}`} >
                                        Vị trí 3 trùng {content?.split('|')[2]?.split(':')[1]?.split(',')[2]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[2]?.split(':')[1]?.split(',')[3], 10) > 0 ? 'green' : ''}`} >
                                        Vị trí 4 trùng {content?.split('|')[2]?.split(':')[1]?.split(',')[3]} lần
                                    </div>
                                    <div className={`file-name tab-2 ${parseInt(content?.split('|')[2]?.split(':')[1]?.split(',')[4], 10) > 0 ? 'green' : ''}`} >
                                        Vị trí 5 trùng {content?.split('|')[2]?.split(':')[1]?.split(',')[4]} lần
                                    </div>

                                </div>
                            </>
                        ))}
                    </div>
                </div>
            ))}
        </>
    )
}
