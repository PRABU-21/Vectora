import React from 'react';

const ResumeCanvas = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex justify-center items-start">
      <div 
        className="bg-white shadow-lg overflow-hidden"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '794px',
          maxHeight: '1123px',
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="h-full"
          style={{
            paddingTop: '32px',
            paddingBottom: '32px',
            paddingLeft: '40px',
            paddingRight: '40px',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResumeCanvas;