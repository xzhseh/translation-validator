#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <llvm/IR/Module.h>
#include <llvm/IRReader/IRReader.h>
#include <llvm/Support/SourceMgr.h>
#include <llvm/IR/Constants.h>
#include "ir/function.h"
#include "ir/memory.h"
#include "ir/type.h"
#include "ir/value.h"
#include "ir/instr.h"
#include "smt/smt.h"
#include "smt/ctx.h"
#include "smt/solver.h"
#include "tools/transform.h"
#include "util/errors.h"
#include "llvm/IR/Instructions.h"
#include "smt/expr.h"

std::string readFile(const std::string &filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        throw std::runtime_error("unable to open file: " + filename);
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

// Helper function to convert LLVM Type to IR::Type
std::unique_ptr<IR::Type> convertLLVMTypeToIR(llvm::Type *llvmType) {
    if (llvmType->isIntegerTy()) {
        return std::make_unique<IR::IntType>("i" + std::to_string(llvmType->getIntegerBitWidth()), 
                                             llvmType->getIntegerBitWidth());
    } else if (llvmType->isPointerTy()) {
        return std::make_unique<IR::PtrType>(llvmType->getPointerAddressSpace());
    } else {
        throw std::runtime_error("unsupported type");
    }
}

// Helper function to convert LLVM AttributeSet to IR::FnAttrs
IR::FnAttrs convertLLVMAttributesToIR(const llvm::AttributeList& llvmAttrs) {
    IR::FnAttrs irAttrs;
    // Convert relevant attributes
    // Example: if (llvmAttrs.hasFnAttribute(llvm::Attribute::NoReturn)) irAttrs.add(IR::FnAttrs::NoReturn);
    return irAttrs;
}

class TypeCache {
public:
    static IR::IntType &getIntType(unsigned bitWidth) {
        static std::map<unsigned, std::unique_ptr<IR::IntType>> cache;
        auto it = cache.find(bitWidth);
        if (it == cache.end()) {
            it = cache.emplace(bitWidth, 
                std::make_unique<IR::IntType>("i" + std::to_string(bitWidth), bitWidth)).first;
        }
        return *it->second;
    }
};

std::unique_ptr<IR::Value> convertLLVMValueToIR(const llvm::Value &value) {
    if (auto *Const = llvm::dyn_cast<llvm::ConstantInt>(&value)) {
        auto &IntTy = TypeCache::getIntType(Const->getBitWidth());
        if (Const->getBitWidth() <= 64) {
            return std::make_unique<IR::IntConst>(IntTy, Const->getSExtValue());
        } else {
            throw std::runtime_error("not yet supported for ints > 64 bits");
        }
    } else if (auto *Arg = llvm::dyn_cast<llvm::Argument>(&value)) {
        auto ArgTy = convertLLVMTypeToIR(Arg->getType());
        return std::make_unique<IR::Input>(*ArgTy, Arg->getName().str());
    } else if (auto *AllocaInst = llvm::dyn_cast<llvm::AllocaInst>(&value)) {
        auto type = convertLLVMTypeToIR(AllocaInst->getAllocatedType());
        auto size = convertLLVMValueToIR(*AllocaInst->getArraySize());
        auto instr = std::make_unique<IR::Alloc>(
            *type,
            AllocaInst->getName().str(),
            *size,
            // mul is nullptr for simple allocas
            nullptr,
            AllocaInst->getAlign().value()
        );
        return instr;
    } else if (auto *LoadInst = llvm::dyn_cast<llvm::LoadInst>(&value)) {
        auto type = convertLLVMTypeToIR(LoadInst->getType());
        auto ptr = convertLLVMValueToIR(*LoadInst->getPointerOperand());
        auto instr = std::make_unique<IR::Load>(
            *type,
            LoadInst->getName().str(),
            *ptr,
            LoadInst->getAlign().value()
        );
        return instr;
    } else if (auto *BinOp = llvm::dyn_cast<llvm::BinaryOperator>(&value)) {
        // Handle binary operations
        auto type = convertLLVMTypeToIR(BinOp->getType());
        auto lhs = convertLLVMValueToIR(*BinOp->getOperand(0));
        auto rhs = convertLLVMValueToIR(*BinOp->getOperand(1));
        
        IR::BinOp::Op op;
        switch (BinOp->getOpcode()) {
            case llvm::Instruction::Add: op = IR::BinOp::Add; break;
            case llvm::Instruction::Sub: op = IR::BinOp::Sub; break;
            case llvm::Instruction::Mul: op = IR::BinOp::Mul; break;
            // add more cases as needed
            default: throw std::runtime_error("unsupported binary operation");
        }
        
        bool nsw = false;
        if (BinOp->getOpcode() == llvm::Instruction::Add ||
            BinOp->getOpcode() == llvm::Instruction::Sub ||
            BinOp->getOpcode() == llvm::Instruction::Mul) {
            nsw = BinOp->hasNoSignedWrap();
        }
        
        return std::make_unique<IR::BinOp>(*type, BinOp->getName().str(), *lhs, *rhs, op, nsw);
    }

    // if we reach here, it's an unsupported value type
    std::string typeName {};
    if (value.getType()->isVoidTy()) {
        typeName = "void";
    } else if (value.getType()->isStructTy()) {
        typeName = "struct: " + value.getType()->getStructName().str();
    } else {
        typeName = std::to_string(value.getType()->getTypeID());
    }
    
    std::string errorMsg = "unsupported value type: " + typeName;
    if (!value.getName().empty()) {
        errorMsg += " (Name: " + value.getName().str() + ")";
    }
    
    // Print additional debug information
    llvm::errs() << "Debug info for unsupported value:\n";
    llvm::errs() << "  LLVM Value: ";
    value.print(llvm::errs());
    llvm::errs() << "\n  Type ID: " << value.getType()->getTypeID() << "\n";

    throw std::runtime_error(errorMsg);
}

// New helper function to convert LLVM binary operations to IR binary operations
IR::BinOp::Op convertLLVMBinOpToIR(llvm::Instruction::BinaryOps llvmOp) {
    switch (llvmOp) {
        case llvm::Instruction::Add:  return IR::BinOp::Add;
        case llvm::Instruction::Sub:  return IR::BinOp::Sub;
        case llvm::Instruction::Mul:  return IR::BinOp::Mul;
        case llvm::Instruction::SDiv: return IR::BinOp::SDiv;
        case llvm::Instruction::UDiv: return IR::BinOp::UDiv;
        // todo: add more cases as needed
        default: 
            throw std::runtime_error("unsupported binary operation");
    }
}

class TypeCacheBeta {
public:
    static IR::Type &getType(llvm::Type *llvmType) {
        static std::map<llvm::Type *, std::unique_ptr<IR::Type>> cacheBeta;
        auto it = cacheBeta.find(llvmType);
        if (it == cacheBeta.end()) {
            auto newType = convertLLVMTypeToIR(llvmType);
            it = cacheBeta.emplace(llvmType, std::move(newType)).first;
        }
        return *it->second;
    }
};

IR::Function convertLLVMFunctionToIRBeta(const llvm::Function *llvmFunc) {
    if (!llvmFunc) {
        throw std::runtime_error("Null LLVM Function pointer");
    }

    auto &returnType = TypeCacheBeta::getType(llvmFunc->getReturnType());
    IR::Function irFunc(returnType, llvmFunc->getName().str(),
                        llvmFunc->getParent()->getDataLayout().getPointerSizeInBits(),
                        llvmFunc->getParent()->getDataLayout().getPointerSizeInBits(),
                        llvmFunc->getParent()->getDataLayout().isLittleEndian());

    // Set function attributes
    irFunc.getFnAttrs() = convertLLVMAttributesToIR(llvmFunc->getAttributes());

    // Add function inputs
    for (const auto& Arg : llvmFunc->args()) {
        auto argType = convertLLVMTypeToIR(Arg.getType());
        auto argValue = std::make_unique<IR::Input>(*argType, Arg.getName().str());
        irFunc.addInput(std::move(argValue));
    }

    // Create entry block
    const llvm::BasicBlock &entryBB = llvmFunc->getEntryBlock();
    std::string entryName = entryBB.getName().str();
    if (entryName.empty()) {
        entryName = "#entry";
    } else {
        entryName = "#start";
    }
    auto &initialBB = irFunc.getBB(entryName, false);

    // handle the return instruction
    for (const auto &I : entryBB) {
        if (auto *RetInst = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
            if (RetInst->getReturnValue()) {
                auto retVal = convertLLVMValueToIR(*RetInst->getReturnValue());
                auto retName = retVal->getName();
                // transfer ownership of retVal to the function
                irFunc.addConstant(std::move(retVal));
                auto globalRetVal = irFunc.getGlobalVar(retName);
                auto instr = std::make_unique<IR::Return>(globalRetVal->getType(), *globalRetVal);
                initialBB.addInstr(std::move(instr));
                for (auto &i : initialBB.instrs()) {
                    std::cout << "Instruction: " << i.getName() << std::endl;
                    std::cout << "Type: " << i.getType().toString() << std::endl;
                    std::cout << "Instruction details: ";
                    i.print(std::cout);
                    std::cout << std::endl << "-------------------" << std::endl;
                }
            } else {
                throw std::runtime_error("return instruction has no return value");
            }
            break;
        }
    }

    irFunc.topSort();

    std::cout << "finish converting function: " << irFunc.getName() << std::endl;
    irFunc.print(std::cout);
    return irFunc;
}

// IR::Function convertLLVMFunctionToIR(const llvm::Function *llvmFunc) {
//     // create the IR::Function with the correct return type and name
//     auto returnType = convertLLVMTypeToIR(llvmFunc->getReturnType());
//     IR::Function irFunc(*returnType, llvmFunc->getName().str(),
//                         llvmFunc->getParent()->getDataLayout().getPointerSizeInBits(),
//                         llvmFunc->getParent()->getDataLayout().getPointerSizeInBits(),
//                         llvmFunc->getParent()->getDataLayout().isLittleEndian());

//     // set function attributes
//     irFunc.getFnAttrs() = convertLLVMAttributesToIR(llvmFunc->getAttributes());

//     // create `#init` block
//     irFunc.getBB("#init", false);

//     // create entry block
//     const llvm::BasicBlock &entryBB = llvmFunc->getEntryBlock();
//     std::string entryName = entryBB.getName().str();
//     if (entryName.empty()) {
//         entryName = "entry";
//     }
//     irFunc.getBB(entryName, false);

//     // create rest of the blocks
//     for (const auto &BB : *llvmFunc) {
//         if (&BB == &entryBB) {
//             // skip entry block as we've already created it
//             continue;
//         }
//         std::string bbName = BB.getName().str();
//         if (bbName.empty()) {
//             bbName = "bb_" + std::to_string(irFunc.getNumBBs());
//         }
//         irFunc.getBB(bbName, false);
//     }

//     // add instructions to each block
//     for (const auto &BB : *llvmFunc) {
//         auto &irBB = irFunc.getBB(BB.getName().str().empty() ? "bb_" + std::to_string(irFunc.getNumBBs() - 1) : BB.getName().str());
//         std::cout << "LLVM basic block: " << (BB.getName().empty() ? "<unnamed>" : BB.getName().str()) << std::endl;
//         std::cout << "Added IR basic block: " << irBB.getName() << std::endl;
//         for (const auto &I : BB) {
//             if (auto *AllocaInst = llvm::dyn_cast<llvm::AllocaInst>(&I)) {
//                 // alloca
//                 auto type = convertLLVMTypeToIR(AllocaInst->getAllocatedType());
//                 auto size = convertLLVMValueToIR(*AllocaInst->getArraySize());
//                 auto instr = std::make_unique<IR::Alloc>(
//                     *type,
//                     AllocaInst->getName().str(),
//                     *size,
//                     // mul is nullptr for simple allocas
//                     nullptr,
//                     AllocaInst->getAlign().value()
//                 );
//                 irBB.addInstr(std::move(instr));
//             } else if (auto *StoreInst = llvm::dyn_cast<llvm::StoreInst>(&I)) {
//                 // store
//                 auto value = convertLLVMValueToIR(*StoreInst->getValueOperand());
//                 auto ptr = convertLLVMValueToIR(*StoreInst->getPointerOperand());
//                 auto instr = std::make_unique<IR::Store>(
//                     *ptr,
//                     *value,
//                     StoreInst->getAlign().value()
//                 );
//                 irBB.addInstr(std::move(instr));
//             } else if (auto *LoadInst = llvm::dyn_cast<llvm::LoadInst>(&I)) {
//                 // load
//                 auto type = convertLLVMTypeToIR(LoadInst->getType());
//                 auto ptr = convertLLVMValueToIR(*LoadInst->getPointerOperand());
//                 auto instr = std::make_unique<IR::Load>(
//                     *type,
//                     LoadInst->getName().str(),
//                     *ptr,
//                     LoadInst->getAlign().value()
//                 );
//                 irBB.addInstr(std::move(instr));
//             } else if (auto *BinOp = llvm::dyn_cast<llvm::BinaryOperator>(&I)) {
//                 // binary operation, i.e., x op y.
//                 auto op = convertLLVMBinOpToIR(BinOp->getOpcode());
//                 auto type = convertLLVMTypeToIR(BinOp->getType());
//                 auto lhs = convertLLVMValueToIR(*BinOp->getOperand(0));
//                 auto rhs = convertLLVMValueToIR(*BinOp->getOperand(1));
//                 auto instr = std::make_unique<IR::BinOp>(
//                     *type,
//                     BinOp->getName().str(),
//                     *lhs,
//                     *rhs,
//                     op);
//                 irBB.addInstr(std::move(instr));
//             } else if (auto *RetInst = llvm::dyn_cast<llvm::ReturnInst>(&I)) {
//                 // return instruction, i.e., return x.
//                 std::cout << "return instruction" << std::endl;
//                 auto retVal = RetInst->getReturnValue() 
//                     ? convertLLVMValueToIR(*RetInst->getReturnValue())
//                     : std::make_unique<IR::VoidValue>();
//                 auto instr = std::make_unique<IR::Return>(retVal->getType(), *retVal);
//                 irBB.addInstr(std::move(instr));
//                 irFunc.addConstant(std::move(retVal));
//             } else {
//                 // todo: add more instruction type handling here
//                 std::string opcodeName = I.getOpcodeName();
//                 std::string errorMsg = "unsupported instruction type: " + opcodeName;
//                 if (!I.getName().empty()) {
//                     errorMsg += " (Name: " + I.getName().str() + ")";
//                 }
//                 throw std::runtime_error(errorMsg);
//             }
//         }
//     }

//     // add function inputs
//     for (const auto& Arg : llvmFunc->args()) {
//         auto argType = convertLLVMTypeToIR(Arg.getType());
//         auto argValue = std::make_unique<IR::Input>(*argType, Arg.getName().str());
//         irFunc.addInput(std::move(argValue));
//     }

//     // handle constants
//     for (auto it = llvmFunc->getParent()->global_begin(); it != llvmFunc->getParent()->global_end(); ++it) {
//         if (auto *GV = llvm::dyn_cast<llvm::GlobalVariable>(&*it)) {
//             auto constValue = convertLLVMValueToIR(*GV);
//             irFunc.addConstant(std::move(constValue));
//         }
//     }

//     irFunc.topSort();

//     std::cout << "finish converting function: " << irFunc.getName() << std::endl;
//     irFunc.print(std::cout);
//     return irFunc;
// }

bool validateTranslation(const std::string &cppIR, const std::string &rustIR) {
    llvm::LLVMContext context {};
    llvm::SMDiagnostic err {};

    std::unique_ptr<llvm::Module> cppModule = llvm::parseIRFile(cppIR, err, context);
    if (!cppModule) {
        std::cerr << "error parsing cpp ir file" << std::endl;
        return false;
    }

    std::unique_ptr<llvm::Module> rustModule = llvm::parseIRFile(rustIR, err, context);
    if (!rustModule) {
        std::cerr << "error parsing rust ir file" << std::endl;
        return false;
    }

    tools::Transform transform {};
    transform.name = "test";

    llvm::Function *cppFunc = cppModule->getFunction("_Z3retv");
    llvm::Function *rustFunc = rustModule->getFunction("_ZN10simple_ret3ret17he935617c8a39ff88E");

    std::cout << "cpp func: " << cppFunc->getName().str() << std::endl;
    std::cout << "rust func: " << rustFunc->getName().str() << std::endl;

    transform.src = convertLLVMFunctionToIRBeta(cppFunc);
    std::cout << "finish converting cpp func" << std::endl;

    transform.tgt = convertLLVMFunctionToIRBeta(rustFunc);
    std::cout << "finish converting rust func" << std::endl;

    transform.print(std::cout);

    // create a TransformVerify object
    bool check_each_var = true;
    tools::TransformVerify verifier(transform, check_each_var);

    std::cout << "transform.src.bits(): " << transform.src.getType().bits() << std::endl;
    std::cout << "transform.tgt.bits(): " << transform.tgt.getType().bits() << std::endl;

    // verify the transformation
    std::cout << "begin verifying" << std::endl;
    util::Errors errors = verifier.verify();

    bool equivalent = !errors; // use the bool operator of Errors

    if (equivalent) {
        std::cout << "translation is semantically equivalent" << std::endl;
    } else {
        std::cout << "translation is not semantically equivalent" << std::endl;
        // print out the errors
        std::cerr << errors << std::endl;
    }

    // print warnings if any
    if (errors.hasWarnings()) {
        std::cerr << "warnings:" << std::endl;
        errors.printWarnings(std::cerr);
    }

    return equivalent;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "usage: " << argv[0] << " <cpp_src_file> <rust_src_file>" << std::endl;
        return 1;
    }

    std::string cppIRFile = argv[1];
    std::string rustIRFile = argv[2];

    smt::ctx.init();

    std::cout << "before mkUInt" << std::endl;
    auto res = smt::expr::mkUInt(0, 32);
    std::cout << "after mkUInt" << std::endl;
    std::cout << "res: " << res << std::endl;

    try {
        bool result = validateTranslation(cppIRFile, rustIRFile);
        return result ? 0 : 1;
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << std::endl;
        return 1;
    }
}
