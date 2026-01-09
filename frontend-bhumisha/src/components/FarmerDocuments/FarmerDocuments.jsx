import React, { useRef } from "react";
import { X, Upload, FileText, Image, File } from "lucide-react";

const FarmerDocuments = ({ close }) => {
  const fileInputRefs = useRef({});

  const documentTypes = [
    {
      id: "aadhar",
      label: "Aadhar Card",
      icon: <FileText size={20} />,
      accept: "image/*,.pdf",
      multiple: false,
    },
    {
      id: "pan",
      label: "PAN Card",
      icon: <FileText size={20} />,
      accept: "image/*,.pdf",
      multiple: false,
    },
    {
      id: "land",
      label: "Land Holding Records",
      icon: <FileText size={20} />,
      accept: "image/*,.pdf,.doc,.docx",
      multiple: true,
    },
    {
      id: "voter",
      label: "Voter ID",
      icon: <FileText size={20} />,
      accept: "image/*,.pdf",
      multiple: false,
    },
    {
      id: "photo",
      label: "Farmer Photo",
      icon: <Image size={20} />,
      accept: "image/*",
      multiple: false,
    },
    {
      id: "other",
      label: "Other Documents",
      icon: <File size={20} />,
      accept: "*",
      multiple: true,
    },
  ];

  const [uploadedFiles, setUploadedFiles] = React.useState({
    aadhar: [],
    pan: [],
    land: [],
    voter: [],
    photo: [],
    other: [],
  });

  const handleFileUpload = (type, files) => {
    const fileArray = Array.from(files);
    setUploadedFiles((prev) => ({
      ...prev,
      [type]: documentTypes.find((d) => d.id === type)?.multiple
        ? [...prev[type], ...fileArray]
        : [fileArray[0]],
    }));
  };

  const removeFile = (type, index) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    handleFileUpload(type, files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerFileInput = (type) => {
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type].click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={close}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Farmer Documents
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Upload and manage important farmer documents
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentTypes.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      {doc.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {doc.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {doc.multiple
                          ? "Multiple files allowed"
                          : "Single file only"}
                      </p>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
                      ${
                        uploadedFiles[doc.id]?.length > 0
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                    onClick={() => triggerFileInput(doc.id)}
                    onDrop={(e) => handleDrop(doc.id, e)}
                    onDragOver={handleDragOver}
                  >
                    <input
                      type="file"
                      ref={(el) => (fileInputRefs.current[doc.id] = el)}
                      className="hidden"
                      accept={doc.accept}
                      multiple={doc.multiple}
                      onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                    />

                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="p-3 bg-blue-100 rounded-full mb-3">
                        <Upload size={24} className="text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="text-blue-600 font-medium">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.accept === "*"
                          ? "Any file type accepted"
                          : doc.accept
                              .replace(/image\/\*|\./g, "")
                              .replace(/,/g, ", ")
                              .toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles[doc.id]?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedFiles[doc.id].map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-white rounded">
                              <FileText size={16} className="text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(doc.id, index);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <X size={16} className="text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 bg-gray-50 rounded-xl p-5">
              <h4 className="font-semibold text-gray-800 mb-3">
                Upload Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {documentTypes.map((doc) => (
                  <div key={doc.id} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadedFiles[doc.id]?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {doc.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helper Text */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Make sure all documents are clear and
                readable. Maximum file size per upload is 10MB. Supported
                formats: Images, PDF, Word documents.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={close}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add your upload logic here
                  alert("Documents uploaded successfully!");
                  close();
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upload All Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDocuments;
