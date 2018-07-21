import * as ts from "typescript";
import { Context, NodeParser } from "../NodeParser";
import { SubNodeParser } from "../SubNodeParser";
import { BaseType } from "../Type/BaseType";
import { ObjectProperty, ObjectType } from "../Type/ObjectType";
import { inspectAllJsDocTags } from "../Utils/isHidden";

export class InterfaceNodeParser implements SubNodeParser {
    public constructor(
        private typeChecker: ts.TypeChecker,
        private childNodeParser: NodeParser,
        private visibility: string,
    ) {
    }

    public supportsNode(node: ts.InterfaceDeclaration): boolean {
        return node.kind === ts.SyntaxKind.InterfaceDeclaration;
    }
    public createType(node: ts.InterfaceDeclaration, context: Context): BaseType {
        if (node.typeParameters && node.typeParameters.length) {
            node.typeParameters.forEach((typeParam) => {
                const nameSymbol = this.typeChecker.getSymbolAtLocation(typeParam.name)!;
                context.pushParameter(nameSymbol.name);

                if (typeParam.default) {
                    const type = this.childNodeParser.createType(typeParam.default, context);
                    context.setDefault(nameSymbol.name, type);
                }
            });
        }

        return new ObjectType(
            this.getTypeId(node, context),
            this.getBaseTypes(node, context),
            this.getProperties(node, context),
            this.getAdditionalProperties(node, context),
        );
    }

    private getBaseTypes(node: ts.InterfaceDeclaration, context: Context): BaseType[] {
        if (!node.heritageClauses) {
            return [];
        }

        return node.heritageClauses.reduce((result: BaseType[], baseType) => [
            ...result,
            ...baseType.types.map((expression) => this.childNodeParser.createType(expression, context)),
        ], []);
    }

    private getProperties(node: ts.InterfaceDeclaration, context: Context): ObjectProperty[] {
        return node.members
            .filter((property) => property.kind === ts.SyntaxKind.PropertySignature)
            .reduce((result: ObjectProperty[], propertyNode: ts.PropertySignature) => {
                const propertySymbol: ts.Symbol = (propertyNode as any).symbol;
                if (inspectAllJsDocTags(propertySymbol, this.visibility)) {
                    return result;
                }
                const objectProperty: ObjectProperty = new ObjectProperty(
                    propertySymbol.getName(),
                    this.childNodeParser.createType(propertyNode.type!, context),
                    !propertyNode.questionToken,
                );

                result.push(objectProperty);
                return result;
            }, []);
    }
    private getAdditionalProperties(node: ts.InterfaceDeclaration, context: Context): BaseType | false {
        const property = node.members.find((it) => it.kind === ts.SyntaxKind.IndexSignature);
        if (!property) {
            return false;
        }

        const signature = property as ts.IndexSignatureDeclaration;
        return this.childNodeParser.createType(signature.type!, context);
    }

    private getTypeId(node: ts.Node, context: Context): string {
        const fullName = `interface-${node.getFullStart()}`;
        const argumentIds = context.getArguments().map((arg) => arg.getId());

        return argumentIds.length ? `${fullName}<${argumentIds.join(",")}>` : fullName;
    }
}
